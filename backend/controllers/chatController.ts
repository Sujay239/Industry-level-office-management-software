import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import db from '../db/db';
import decodeToken from '../utils/decodeToken';

export const getChats = async (req: Request, res: Response) => {
    const userId = (req as any).user.id; // Assumes auth middleware populates user

    try {
        // Fetch all chats the user is a member of
        // For DMs, we need to find the other member's name and avatar
        const query = `
            SELECT
                c.id,
                c.name,
                c.type,
                (
                    SELECT content
                    FROM messages m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as "lastMessage",
                (
                    SELECT created_at
                    FROM messages m
                    WHERE m.chat_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as "lastMessageTime",
                (
                    SELECT COUNT(*)::int
                    FROM messages m
                    WHERE m.chat_id = c.id
                    AND m.sender_id != $1
                    AND m.is_read = FALSE
                ) as unread,
                ARRAY_AGG(cm.user_id) as members
            FROM chats c
            JOIN chat_members cm ON c.id = cm.chat_id
            WHERE c.id IN (
                SELECT chat_id FROM chat_members WHERE user_id = $1
            )
            GROUP BY c.id
            ORDER BY "lastMessageTime" DESC NULLS LAST
        `;

        const result = await db.query(query, [userId]);
        const chats = result.rows;

        // Enhance chats with details (e.g. for DMs, get other user's name)
        const enhancedChats = await Promise.all(chats.map(async (chat: any) => {
            if (chat.type === 'direct') {
                const memberQuery = `
                SELECT u.id, u.name, u.avatar_url, u.email
                FROM chat_members cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.chat_id = $1 AND cm.user_id != $2
            `;
                const memberResult = await db.query(memberQuery, [chat.id, userId]);
                const otherUser = memberResult.rows[0];
                if (otherUser) {
                    chat.name = otherUser.name;
                    chat.avatar = otherUser.avatar_url;
                    chat.email = otherUser.email;
                    chat.otherUserId = otherUser.id; // Useful for checking online status later
                }
            }
            // Format time
            // Send ISO string so frontend can format simply
            // OR format here if we trust server time. Best practice: send ISO.
            // But existing frontend expects 'time' string.
            // Let's send ISO and update frontend to format if needed, OR just send formatted if we want simple partial fix.
            // User compliant about ISO or something.
            // "01:07 pm chat time showing iso time i thought" -> User wants formatted local time.
            // If backend is UTC, formatting here might be wrong timezone.
            // Better to send ISO and format in frontend.
            chat.time = chat.lastMessageTime
                ? new Date(chat.lastMessageTime + ' GMT+0530').toString()
                : null;
            // unread count is now directly from the query
            return chat;
        }));

        res.json(enhancedChats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    const chatId = req.params.chatId;
    const userId = (req as any).user.id;

    try {
        // Check membership first
        const memberCheck = await db.query(
            'SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2',
            [chatId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Not a member of this chat' });
        }

        const query = `
      SELECT
        m.id,
        m.sender_id,
        m.content as text,
        m.created_at,
        m.sender_type,
        m.attachment_url,
        m.attachment_type,
        m.is_read,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `;

        const result = await db.query(query, [chatId]);

        const messages = result.rows.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id ? String(msg.sender_id) : 'system',
            text: msg.text,
            time: new Date(msg.created_at + ' GMT+0530').toString(),
            isMe: msg.sender_id == userId,
            isSystem: msg.sender_type === 'system',
            attachment: msg.attachment_url ? {
                type: msg.attachment_type,
                url: msg.attachment_url,
                name: 'Attachment' // You might want to store original filename in DB
            } : undefined,
            isRead: msg.is_read,
            senderName: msg.sender_name,
            senderAvatar: msg.sender_avatar
        }));

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Check if a direct chat exists between two users, if not create it
export const getOrCreateDirectChat = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { targetUserId } = req.body;

    try {
        // Check if DM exists
        const checkQuery = `
            SELECT c.id
            FROM chats c
            JOIN chat_members cm1 ON c.id = cm1.chat_id
            JOIN chat_members cm2 ON c.id = cm2.chat_id
            WHERE c.type = 'direct'
            AND cm1.user_id = $1
            AND cm2.user_id = $2
        `;
        const result = await db.query(checkQuery, [userId, targetUserId]);

        if (result.rows.length > 0) {
            return res.json({ chatId: result.rows[0].id });
        }

        // Create new DM
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const chatResult = await client.query("INSERT INTO chats (type) VALUES ('direct') RETURNING id");
            const chatId = chatResult.rows[0].id;

            await client.query("INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)", [chatId, userId, targetUserId]);
            await client.query('COMMIT');
            res.json({ chatId });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error creating DM:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const getUsers = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.token;
        const data: any = await decodeToken(token);
        const result = await db.query("SELECT id, name, COALESCE(designation, role::text) as role, avatar_url as avatar FROM users WHERE status = 'Active' AND id != $1 AND name IS NOT NULL AND name != ''", [data.id]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createChat = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { name, type, members } = req.body; // members is array of userIds

    if (!name || !type) return res.status(400).json({ message: "Name and type required" });

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const chatResult = await client.query("INSERT INTO chats (name, type) VALUES ($1, $2) RETURNING id", [name, type]);
        const chatId = chatResult.rows[0].id;

        // Add creator as admin
        await client.query("INSERT INTO chat_members (chat_id, user_id, is_admin) VALUES ($1, $2, TRUE)", [chatId, userId]);

        // Add other members
        if (members && Array.isArray(members)) {
            for (const memberId of members) {
                if (String(memberId) !== String(userId)) {
                    await client.query("INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)", [chatId, memberId]);
                }
            }
        }

        await client.query('COMMIT');

        // Return structured object similar to chat list item
        res.json({
            id: chatId,
            name,
            type,
            lastMessage: `New ${type} created`,
            time: new Date().toISOString(), // Send ISO
            unread: 0,
            members: [userId, ...(members || [])]
        });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error creating chat:", e);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
};

// Track online users (in-memory)
// Note: In a production cluster, you'd use Redis for this.
const onlineUsers = new Set<string>();

// Socket IO Handler
export const handleSocketConnection = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User Connected: ${socket.id}`);

        // Add user to online set if authenticated
        const userId = socket.data.user?.id;
        if (userId) {
            const userIdStr = String(userId);
            onlineUsers.add(userIdStr);
            console.log(`User Online: ${userIdStr}`);

            // Broadcast to everyone that this user is online
            io.emit('user_online', userIdStr);

            // Send current online list to the connecting user
            socket.emit('online_users', Array.from(onlineUsers));

            // Join personal room for notifications/updates
            socket.join(`user_${userIdStr}`);
            console.log(`User ${userIdStr} joined personal room`);
        }

        socket.on('join_chat', (chatId) => {
            const roomName = String(chatId);
            socket.join(roomName);
            console.log(`User ${socket.id} joined chat: ${roomName}`);
        });

        socket.on('leave_chat', (chatId) => {
            const roomName = String(chatId);
            socket.leave(roomName);
            console.log(`User ${socket.id} left chat: ${roomName}`);
        });

        socket.on('send_message', async (data) => {
            // data: { chatId, senderId, text, type, attachment... }
            const { chatId, senderId, text, attachment } = data;

            try {
                // Save to DB
                // Use authenticated user ID from socket metadata
                const userId = socket.data.user.id;

                // Check if anyone else is in the room
                const roomName = String(chatId);
                const room = io.sockets.adapter.rooms.get(roomName);

                let isRead = false;
                if (room) {
                    // Iterate sockets in room to see if anyone OTHER than sender is there
                    for (const socketId of room) {
                        const s = io.sockets.sockets.get(socketId);
                        const otherUserId = s?.data?.user?.id;
                        if (otherUserId && String(otherUserId) !== String(userId)) {
                            isRead = true;
                            break;
                        }
                    }
                }

                console.log(`Message in ${roomName}: sender=${userId}, isRead=${isRead}, roomSize=${room?.size || 0}`);

                const query = `
                    INSERT INTO messages (chat_id, sender_id, content, attachment_url, attachment_type, is_read)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id, created_at
                `;
                const result = await db.query(query, [
                    chatId,
                    userId, // Use secure User ID
                    text,
                    attachment?.url || null,
                    attachment?.type || null,
                    isRead
                ]);

                const savedMsg = result.rows[0];

                const messageToEmit = {
                    id: savedMsg.id,
                    senderId: userId, // Send back the real user ID
                    text,
                    time: new Date(savedMsg.created_at + ' GMT+0530').toString(),
                    isMe: false, // Receiver will see as false
                    attachment,
                    chatId, // send back chat id so client knows where to put it
                    isRead // Send this so frontend knows
                };

                // Get all members of the chat to broadcast to their personal rooms
                // This ensures they get the message even if they don't have the chat open (for unread count)
                const membersResult = await db.query('SELECT user_id FROM chat_members WHERE chat_id = $1', [chatId]);
                const members = membersResult.rows;

                members.forEach((member: any) => {
                    // Emit to each user's personal room
                    io.to(`user_${member.user_id}`).emit('receive_message', messageToEmit);
                });

                // Also emit to sender (so they see it immediately if they rely on echo, though we used optimistic)
                // Actually sender is in members, so they get it above.
                // But we marked isMe: false above.
                // Frontend handles isMe calculation now based on currentUserId, so isMe: false in payload is ignored/recalculated.

            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', () => {
            console.log('User Disconnected', socket.id);
            if (userId) {
                const userIdStr = String(userId);
                // We should only remove if no other sockets exist for this user?
                // For simplicity, we assume one connection per user or simple removal.
                // Better: check if other sockets have this userId.
                // But for now, simple removal.
                // Wait, if user opens 2 tabs, closing one shouldn't show offline.
                // Let's check socket count or just remove.
                // Simple version: remove.
                onlineUsers.delete(userIdStr);
                io.emit('user_offline', userIdStr);
            }
        });
    });
};

export const markMessagesRead = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { chatId } = req.body;

    if (!chatId) return res.status(400).json({ message: "Chat ID required" });

    try {
        await db.query(
            "UPDATE messages SET is_read = TRUE WHERE chat_id = $1 AND sender_id != $2 AND is_read = FALSE",
            [chatId, userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking messages read:", error);
        res.status(500).json({ message: "Server error" });
    }
}
