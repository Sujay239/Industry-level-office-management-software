import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Search,
  Plus,
  MoreVertical,
  Image as ImageIcon,
  Paperclip,
  Send,
  ArrowLeft,
  Hash,
  Users,
  MessageSquare,
  Smile,
  Trash2,
  X,
  AlertTriangle,
  Check,
  CheckCheck,
  Download,
  Crown,
  UserPlus,
  UserMinus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotification } from "../../components/NotificationProvider";
import { io } from "socket.io-client";

// --- Types ---
type ChatType = "direct" | "group" | "space";

interface Message {
  id: number;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  isSystem?: boolean;
  attachment?: {
    type: "image" | "file";
    url: string;
    name: string;
  };
  senderName?: string;
  senderAvatar?: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
}

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  type: ChatType;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  members?: string[];
  admins?: string[];
  email?: string;
  role?: string;
  otherUserId?: string;
  phone?: string;
}

// --- Constants ---
const COMMON_EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "jg",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "ww",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "mw",
  "😨",
  "🤔",
  "🤗",
  "👍",
  "👎",
  "👊",
  "✌️",
  "👌",
  "✋",
  "💪",
  "🙏",
  "🔥",
  "✨",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "💯",
  "🎉",
];

// const formatTime = (isoString?: string) => {
//   if (!isoString) return "";
//   if (isoString === "Now") return "Now";

//   const date = new Date(isoString);
//   if (isNaN(date.getTime())) return "";

//   return date.toLocaleTimeString(undefined, {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// Update this function
const formatTime = (isoString?: string) => {
  if (!isoString) return "";
  if (isoString === "Now") return "Now";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // <--- Forces IST
  });
};

const Chats: React.FC = () => {
  // --- State ---
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modal State
  const [modalType, setModalType] = useState<
    | "create-group"
    | "create-space"
    | "delete"
    | "chat-info"
    | "add-member"
    | "confirm-action"
    | null
  >(null);
  const [modalInputValue, setModalInputValue] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    type: "remove" | "admin";
    memberId: string;
  } | null>(null);

  // Typing State
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { showSuccess, showError } = useNotification();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const socket = useRef<any>(null);

  // Refs for tracking state inside socket listeners
  const activeChatRef = useRef<ChatContact | null>(null);
  const currentUserRef = useRef<Employee | null>(null);

  // Keep refs synced with state
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const prevMessagesLength = useRef(0);
  const prevActiveChatId = useRef<string | null>(null);

  // --- Header Visibility Logic ---
  const { setShowMobileHeader } =
    useOutletContext<{ setShowMobileHeader: (v: boolean) => void }>() || {};

  useEffect(() => {
    if (setShowMobileHeader) {
      setShowMobileHeader(!activeChat);
    }
    return () => {
      if (setShowMobileHeader) setShowMobileHeader(true);
    };
  }, [activeChat, setShowMobileHeader]);

  // --- Effects ---

  // 1. Initialize Socket and Fetch Contacts & Get Current User
  useEffect(() => {
    // Fetch Current User
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/auth/myData`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          // Map backend user to Employee interface
          setCurrentUser({
            id: String(data.user.id),
            name: data.user.name,
            role: data.user.role || data.user.designation || "User",
            avatar: data.user.avatar_url,
          });
        }
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    };
    fetchCurrentUser();

    // Fetch Contacts
    // Fetch Contacts
    const fetchContacts = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();

          // --- CHANGE START ---
          // Map the backend 'lastMessageTime' to the frontend 'time'
          const formattedData = data.map((chat: any) => ({
            ...chat,
            // Prefer lastMessageTime, fallback to existing time, or empty
            time: chat.lastMessageTime || chat.time || "",
          }));

          setContacts(formattedData);
          // --- CHANGE END ---
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    };

    fetchContacts();

    // Fetch Employees
    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats/users`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();

    // Socket Connection
    socket.current = io(
      import.meta.env.VITE_API_URL || "http://localhost:3000",
      {
        withCredentials: true,
      }
    );

    socket.current.on("connect", () => {
      console.log("Connected to socket");
    });

    socket.current.on(
      "receive_message",
      (message: Message & { chatId: string }) => {
        // If message.chatId is valid, check if we need to update unread count
        // For Active Chat, append message - REMOVED TO PREVENT DUPLICATES (Handled by local listener)
        if (activeChatRef.current?.id === message.chatId) {
          // setMessages((prev) => [...prev, message]); // DUPLICATE CAUSE
          // Mark as read immediately if window is focused? (Optional optimization)
        }

        // Update last message in sidebar
        // Also if User B was just made admin, a system message might come? No, that's done via chat_updated now.
        setContacts((prev) => {
          return prev
            .map((c) => {
              if (c.id === message.chatId) {
                // If it's a new message, increment unread if not active
                const isUnread = activeChatRef.current?.id !== message.chatId;
                return {
                  ...c,
                  lastMessage: message.text,
                  time: message.time,
                  unread: isUnread ? (c.unread || 0) + 1 : 0,
                };
              }
              return c;
            })
            .sort(
              (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
            ); // simplistic sort
        });
      }
    );

    socket.current.on(
      "chat_updated",
      (data: {
        chatId: string;
        admins: string[];
        members: string[];
        type: string;
      }) => {
        // Update activeChat if it matches
        if (
          activeChatRef.current &&
          String(activeChatRef.current.id) === String(data.chatId)
        ) {
          setActiveChat((prev) =>
            prev
              ? { ...prev, admins: data.admins, members: data.members }
              : null
          );

          // Show toast based on type?
          if (data.type === "admin_update") {
            // Verify if *I* was made admin
            // const myId = String(currentUserRef.current?.id); // Need ref for currentUserId if used, or use valid dependency
            // Simply updating state is enough for UI to re-render buttons
          }
        }

        // Update contact list entry
        setContacts((prev) =>
          prev.map((c) => {
            if (String(c.id) === String(data.chatId)) {
              return { ...c, admins: data.admins, members: data.members };
            }
            return c;
          })
        );
      }
    );

    // Online status listeners
    socket.current.on("online_users", (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    socket.current.on("user_online", (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    });

    socket.current.on("user_offline", (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Typing Listeners
    socket.current.on(
      "typing",
      ({ chatId, userId }: { chatId: string; userId: string }) => {
        // Only show typing if it's the active chat and NOT me
        if (
          activeChatRef.current?.id === chatId &&
          userId !== currentUserRef.current?.id
        ) {
          // Ideally fetch name, but for now we can show "Typing..."
          // Or try to find name in contacts/members
          setTypingUser("Someone");
        }
      }
    );

    socket.current.on(
      "stop_typing",
      ({ chatId, userId }: { chatId: string; userId: string }) => {
        if (
          activeChatRef.current?.id === chatId &&
          userId !== currentUserRef.current?.id
        ) {
          setTypingUser(null);
        }
      }
    );

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // 2. Handle Message Reception specifically for Active Chat appending
  useEffect(() => {
    if (!socket.current) return;

    const handler = (message: Message & { chatId: string }) => {
      if (activeChat && message.chatId === activeChat.id) {
        setMessages((prev) => {
          // Determine isMe based on currentUser - Check both camelCase and snake_case
          const isMe = currentUser
            ? String(message.senderId || (message as any).sender_id) ===
            String(currentUser.id)
            : false;

          // Deduplication for Optimistic Updates:
          // Check if there's a recent message (last 3) with "Now" time and same text
          const optimisticMatchIndex =
            prev.length > 0
              ? prev
                .slice(-3)
                .findIndex(
                  (m) => m.time === "Now" && m.text === message.text && m.isMe
                )
              : -1;

          if (optimisticMatchIndex !== -1) {
            const realIndex =
              prev.length -
              (prev.length > 3 ? 3 : prev.length) +
              optimisticMatchIndex;
            // Replace the optimistic message with the real one
            const newPrev = [...prev];
            newPrev[realIndex] = { ...message, isMe: true };
            return newPrev;
          }

          return [...prev, { ...message, isMe }];
        });
      }
    };

    const readHandler = ({
      chatId,
      readerId,
    }: {
      chatId: string;
      readerId: string;
    }) => {
      // If the read event is for this chat, and the reader is NOT me (meaning someone else read my messages)
      if (
        activeChat &&
        String(chatId) === String(activeChat.id) &&
        String(readerId) !== String(currentUser?.id)
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isMe && !msg.isRead ? { ...msg, isRead: true } : msg
          )
        );
      }
    };

    socket.current.on("receive_message", handler);
    socket.current.on("messages_read", readHandler);

    return () => {
      socket.current.off("receive_message", handler);
      socket.current.off("messages_read", readHandler);
    };
  }, [activeChat, currentUser]);

  // 3. Join Chat Room & Fetch Messages when Active Chat Changes
  useEffect(() => {
    if (activeChat) {
      // Fetch Messages
      const fetchMessages = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000"
            }/api/chats/${activeChat.id}/messages?limit=25`,
            {
              credentials: "include",
            }
          );
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
            setHasMore(data.length === 25);
            // After initial fetch, scroll to bottom
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }, 100);
          }
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      };
      fetchMessages();
      setHasMore(true);
      setIsLoadingMore(false);

      // Join Room
      socket.current.emit("join_chat", activeChat.id);

      setShowEmojiPicker(false);

      return () => {
        socket.current.emit("leave_chat", activeChat.id);
      };
    }
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat) return;

    const isNewChat = prevActiveChatId.current !== activeChat.id;
    const isNewMessage = messages.length > prevMessagesLength.current;
    const scrollContainer = chatContainerRef.current;

    if (scrollContainer) {
      if (isNewChat) {
        // Initial scroll to bottom
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      } else if (isNewMessage) {
        // Only scroll if we were already near bottom OR if it's our own message
        const isNearBottom =
          scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight <
          100;

        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.isMe;

        if (isNearBottom || isMyMessage) {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    }

    prevMessagesLength.current = messages.length;
    prevActiveChatId.current = activeChat.id;
  }, [messages, activeChat]);

  const loadMoreMessages = async () => {
    if (!activeChat || !hasMore || isLoadingMore) return;

    const oldestMessageId = messages[0]?.id;
    if (!oldestMessageId) return;

    setIsLoadingMore(true);
    const container = chatContainerRef.current;
    const oldScrollHeight = container?.scrollHeight || 0;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/api/chats/${activeChat.id}/messages?cursor=${oldestMessageId}&limit=25`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setMessages((prev) => [...data, ...prev]);
          setHasMore(data.length === 25);

          // Preserve scroll position
          requestAnimationFrame(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - oldScrollHeight;
            }
          });
        } else {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error("Failed to load more messages", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  // --- Handlers ---

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    // Emit
    if (activeChat && socket.current) {
      socket.current.emit("send_message", {
        chatId: activeChat.id,
        senderId: currentUser ? currentUser.id : "me",
        text: messageInput,
      });

      // Optimistic Update
      const tempId = Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        senderId: currentUser ? currentUser.id : "me",
        text: messageInput,
        time: "Now",
        isMe: true,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
    }

    setMessageInput("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    handleTyping();
  };

  const handleTyping = () => {
    if (activeChat && socket.current) {
      socket.current.emit("typing", {
        chatId: activeChat.id,
        userId: currentUser?.id,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        if (activeChat && socket.current) {
          socket.current.emit("stop_typing", {
            chatId: activeChat.id,
            userId: currentUser?.id,
          });
        }
      }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    handleTyping();
  };

  // --- Modal & Creation Handlers ---
  const openCreateModal = (type: "group" | "space") => {
    setModalType(type === "group" ? "create-group" : "create-space");
    setModalInputValue("");
    setSelectedMembers([]);
  };

  const toggleMemberSelection = (employeeId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleCreateConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInputValue.trim()) return;

    const type = modalType === "create-group" ? "group" : "space";

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/api/chats/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: modalInputValue,
            type,
            members: selectedMembers,
          }),
        }
      );

      if (res.ok) {
        const newChat = await res.json();
        setContacts([newChat, ...contacts]);
        setActiveChat(newChat);
        setModalType(null);
        showSuccess(
          `${type === "group" ? "Group" : "Space"
          } "${modalInputValue}" created successfully!`
        );
      } else {
        showError("Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating chat", error);
    }
  };

  const initiateDelete = () => setModalType("delete");

  const confirmDelete = async () => {
    if (activeChat) {
      if (activeChat.type !== "direct") {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000"
            }/api/chats/${activeChat.id}/leave`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          );

          if (res.ok) {
            setContacts(contacts.filter((c) => c.id !== activeChat.id));
            setActiveChat(null);
            setModalType(null);
            showSuccess("Left chat successfully");
          } else {
            showError("Failed to leave chat");
          }
        } catch (error) {
          console.error("Error leaving chat", error);
          showError("Error leaving chat");
        }
      } else {
        // Direct chat - just local delete for now (or implement delete API if backend supports)
        setContacts(contacts.filter((c) => c.id !== activeChat.id));
        setActiveChat(null);
        setModalType(null);
      }
    }
  };

  // --- Group Admin Handlers ---
  const handleRemoveMember = (memberId: string) => {
    setPendingAction({ type: "remove", memberId });
    setModalType("confirm-action");
  };

  const handleMakeAdmin = (memberId: string) => {
    setPendingAction({ type: "admin", memberId });
    setModalType("confirm-action");
  };

  const executeConfirmation = async () => {
    if (!activeChat || !pendingAction) return;
    const { type, memberId } = pendingAction;

    let updatedChat = { ...activeChat };
    let sysMsgText = "";

    try {
      if (type === "remove") {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats/${activeChat.id}/remove-member`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId }),
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to remove member");

        if (!activeChat.members) return;
        updatedChat.members = activeChat.members.filter(
          (id) => id !== memberId
        );
        sysMsgText = "Member removed";
        showSuccess("Member removed successfully!");
      } else if (type === "admin") {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats/${activeChat.id}/make-admin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId }),
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Failed to make admin");

        const currentAdmins = activeChat.admins || [];
        if (currentAdmins.includes(memberId)) return;
        updatedChat.admins = [...currentAdmins, memberId];
        sysMsgText = "Member promoted to Admin";
        showSuccess("Member promoted to admin successfully!");
      }

      setActiveChat(updatedChat);
      setContacts(
        contacts.map((c) => (c.id === activeChat.id ? updatedChat : c))
      );

      const sysMsg: Message = {
        id: Date.now(),
        senderId: "system",
        text: sysMsgText,
        time: "Now",
        isMe: false,
        isSystem: true,
      };
      setMessages((prev) => [...prev, sysMsg]);

      setModalType("chat-info");
      setPendingAction(null);
    } catch (error) {
      console.error("Action failed", error);
      showError("Action failed. Please try again.");
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !activeChat.members) return;

    const newMembers = selectedMembers.filter(
      (id) => !activeChat.members?.includes(id)
    );
    if (newMembers.length === 0) {
      setModalType("chat-info");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/chats/${activeChat.id
        }/add-members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ members: newMembers }),
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to add members");

      const updatedChat = {
        ...activeChat,
        members: [...activeChat.members, ...newMembers],
      };
      setActiveChat(updatedChat);
      setContacts(
        contacts.map((c) => (c.id === activeChat.id ? updatedChat : c))
      );
      setModalType("chat-info");
      setSelectedMembers([]);

      const sysMsg: Message = {
        id: Date.now(),
        senderId: "system",
        text: `${newMembers.length} new member(s) added`,
        time: new Date().toISOString(),
        isMe: false,
        isSystem: true,
      };
      setMessages((prev) => [...prev, sysMsg]);
      showSuccess("Members added successfully!");
    } catch (error) {
      console.error("Failed to add members", error);
      showError("Failed to add members");
    }
  };

  // --- File Upload Handlers ---
  const triggerGenericFileUpload = () => fileInputRef.current?.click();

  const triggerImageUpload = () => imageInputRef.current?.click();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isImage: boolean = false
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (activeChat && socket.current) {
        socket.current.emit("send_message", {
          chatId: activeChat.id,
          senderId: "me",
          text: `[${isImage ? "Image" : "File"} Upload Placeholder: ${file.name
            }]`,
        });
      }
    }
  };

  // Merge contacts and employees
  const allDisplayContacts = React.useMemo(() => {
    const displayList = [...contacts];

    employees.forEach((emp) => {
      const exists = contacts.some(
        (c) => c.type === "direct" && String(c.otherUserId) === String(emp.id)
      );

      if (!exists) {
        displayList.push({
          id: `temp_${emp.id}`,
          name: emp.name || "Unknown",
          avatar: emp.avatar,
          type: "direct",
          lastMessage: "",
          time: "",
          unread: 0,
          otherUserId: String(emp.id),
          role: emp.role,
        });
      }
    });

    return displayList.sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return 0;

      const nameA = a.name || "Unknown";
      const nameB = b.name || "Unknown";
      return nameA.localeCompare(nameB);
    });
  }, [contacts, employees]);

  const filteredContacts = allDisplayContacts.filter((c) =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle clicking a contact
  const handleContactClick = async (contact: ChatContact) => {
    if (String(contact.id).startsWith("temp_") && contact.otherUserId) {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats/dm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: contact.otherUserId }),
            credentials: "include",
          }
        );
        if (res.ok) {
          const { chatId } = await res.json();

          const newRealContact: ChatContact = {
            ...contact,
            id: String(chatId),
            type: "direct",
            unread: 0,
          };

          setContacts((prev) => [newRealContact, ...prev]);
          setActiveChat(newRealContact);
        }
      } catch (e) {
        console.error("Error starting chat", e);
      }
    } else {
      setActiveChat(contact);

      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, unread: 0 } : c))
      );

      try {
        await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"
          }/api/chats/mark-read`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: contact.id }),
            credentials: "include",
          }
        );
      } catch (e) {
        console.error("Failed to mark read", e);
      }
    }
  };

  // --- Components ---
  const ChatListItem = ({ contact }: { contact: ChatContact }) => (
    <div
      onClick={() => handleContactClick(contact)}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
        ${activeChat?.id === contact.id
          ? "bg-slate-100 dark:bg-slate-800 border-l-4 border-l-slate-900 dark:border-l-green-500"
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent"
        }
      `}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback
            className={`text-xs font-bold ${contact.type === "space"
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
              : contact.type === "group"
                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              }`}
          >
            {contact.type === "space" ? (
              <Hash size={16} />
            ) : contact.type === "group" ? (
              <Users size={16} />
            ) : (
              (contact.name || "?").substring(0, 2).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>
        {contact.type === "direct" &&
          contact.otherUserId &&
          onlineUsers.has(String(contact.otherUserId)) && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {contact.name || "Unknown"}
          </p>
          {contact.time && (
            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
              {formatTime(contact.time)}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
            {contact.lastMessage ? (
              contact.lastMessage
            ) : (
              <span className="text-slate-400 italic">
                {contact.role || "Available"}
              </span>
            )}
          </p>
          {contact.unread > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-slate-900 dark:bg-green-600 text-[10px] font-bold text-white hover:bg-slate-800 border-none">
              {contact.unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 lg:mt-0">
      <Card className="flex-1 flex overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-950 h-full">
        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`
            w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950
            ${activeChat ? "hidden md:flex" : "flex"}
        `}
        >
          {/* Header (Sticky & App-like) */}
          <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 shadow-sm transition-all pb-4 pt-4">
            {/* Title Row: Standard Alignment */}
            <div className="flex items-center justify-between px-4 pb-2 pr-16 md:pr-4 relative min-h-10 max-sm:hidden">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Messages
              </h2>
            </div>

            {/* Row 2: Search & Controls (Full Width) */}
            <div className="px-4 space-y-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <Input
                  placeholder="Search..."
                  className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 text-slate-900 dark:text-white w-full rounded-xl focus-visible:ring-green-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 transition-all">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-medium dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 cursor-pointer h-9 rounded-lg border-dashed border-slate-300"
                  onClick={() => openCreateModal("space")}
                >
                  <Plus size={14} className="mr-1.5" /> Space
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs font-medium dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 cursor-pointer h-9 rounded-lg border-dashed border-slate-300 dark:border-slate-700"
                  onClick={() => openCreateModal("group")}
                >
                  <Plus size={14} className="mr-1.5" /> Group
                </Button>
              </div>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {filteredContacts.length === 0 ? (
              <div className="text-center text-slate-400 text-sm mt-10">
                No contacts found.
              </div>
            ) : (
              <>
                {filteredContacts.some((c) => c.type === "direct") && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                      Direct
                    </h3>
                    <div className="space-y-1">
                      {filteredContacts
                        .filter((c) => c.type === "direct")
                        .map((contact) => (
                          <ChatListItem key={contact.id} contact={contact} />
                        ))}
                    </div>
                  </div>
                )}
                {(filteredContacts.some((c) => c.type === "group") ||
                  filteredContacts.some((c) => c.type === "space")) && (
                    <div className="mt-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                        Spaces & Groups
                      </h3>
                      <div className="space-y-1">
                        {filteredContacts
                          .filter((c) => c.type !== "direct")
                          .map((contact) => (
                            <ChatListItem key={contact.id} contact={contact} />
                          ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT WINDOW ================= */}
        <div
          className={`
            flex-1 flex-col bg-slate-50/30 dark:bg-slate-900/20 h-full relative
            ${activeChat ? "flex" : "hidden md:flex"}
        `}
        >
          {activeChat ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 text-slate-500"
                    onClick={() => setActiveChat(null)}
                  >
                    <ArrowLeft size={20} />
                  </Button>

                  <Avatar className="h-9 w-9 border border-slate-100 dark:border-slate-700">
                    <AvatarImage src={activeChat.avatar} />
                    <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-200">
                      {activeChat.type === "space" ? (
                        <Hash size={16} />
                      ) : activeChat.type === "group" ? (
                        <Users size={16} />
                      ) : (
                        activeChat.name.substring(0, 2).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 pr-4 py-1 pl-1 rounded-lg transition-colors -ml-2"
                    onClick={() => setModalType("chat-info")}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                        {activeChat.name}
                      </h3>
                      {activeChat.type === "group" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none"
                        >
                          Group
                        </Badge>
                      )}
                      {activeChat.type === "space" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-none"
                        >
                          Space
                        </Badge>
                      )}
                    </div>
                    {activeChat.type === "direct" ? (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${activeChat.otherUserId &&
                            onlineUsers.has(String(activeChat.otherUserId))
                            ? "bg-green-500"
                            : "bg-slate-400"
                            }`}
                        />{" "}
                        {typingUser
                          ? "Typing..."
                          : activeChat.otherUserId &&
                            onlineUsers.has(String(activeChat.otherUserId))
                            ? "Online"
                            : "Offline"}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activeChat.members?.length || 0} Members
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="dark:bg-slate-950 dark:border-slate-800"
                    >
                      <DropdownMenuLabel className="dark:text-slate-200">
                        Chat Options
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="dark:bg-slate-800" />
                      {activeChat.type !== "direct" && (
                        <DropdownMenuItem
                          onClick={() => setModalType("chat-info")}
                          className="dark:text-slate-300 dark:focus:bg-slate-900 cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" /> View Members
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="dark:text-slate-300 dark:focus:bg-slate-900 cursor-pointer">
                        <Search className="mr-2 h-4 w-4" /> Search History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="dark:bg-slate-800" />
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          initiateDelete();
                        }}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />{" "}
                        {activeChat.type !== "direct"
                          ? "Remove Chat"
                          : "Delete Chat"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages List */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-black/20"
              >
                {isLoadingMore && (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900 dark:border-green-600"></div>
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Start the conversation</p>
                  </div>
                ) : (
                  messages.map((msg) =>
                    msg.isSystem ? (
                      <div key={msg.id} className="flex justify-center my-4">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-normal"
                        >
                          {msg.text}
                        </Badge>
                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isMe ? "justify-end" : "justify-start"
                          }`}
                      >
                        <div
                          className={`flex max-w-[85%] md:max-w-[70%] ${msg.isMe ? "flex-row-reverse" : "flex-row"
                            } items-end gap-2`}
                        >
                          {!msg.isMe && (
                            <Avatar className="h-8 w-8 mb-1 mr-1 hidden sm:block">
                              <AvatarImage
                                src={
                                  activeChat.type === "direct"
                                    ? activeChat.avatar
                                    : msg.senderAvatar
                                }
                              />
                              <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                {activeChat.type === "direct"
                                  ? activeChat.name.substring(0, 1)
                                  : msg.senderName
                                    ? msg.senderName.substring(0, 1)
                                    : "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          {/* Message Bubble Wrapper - Modified to show Name */}
                          <div
                            className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"
                              } max-w-full min-w-0`}
                          >
                            {activeChat.type !== "direct" && !msg.isMe && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-2 mb-0.5 font-medium leading-none">
                                {msg.senderName?.split(" ")[0] || "Unknown"}
                              </span>
                            )}
                            <div
                              className={`p-1.5 px-2 rounded-2xl text-[11px] shadow-sm ${msg.isMe
                                ? "bg-slate-900 text-white dark:bg-green-600 rounded-br-none"
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700"
                                }`}
                            >
                              {msg.attachment ? (
                                msg.attachment.type === "image" ? (
                                  <div className="group/image relative mb-1">
                                    <img
                                      src={msg.attachment.url}
                                      alt="Shared"
                                      className="max-w-[150px] sm:max-w-[200px] rounded-lg border border-white/10"
                                    />
                                    <a
                                      href={msg.attachment.url}
                                      download={msg.attachment.name}
                                      className="absolute bottom-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                                      title="Download Image"
                                    >
                                      <Download size={12} />
                                    </a>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-black/20 p-1.5 rounded-lg mb-1">
                                    <div className="p-1 bg-white dark:bg-slate-700 rounded-lg">
                                      <Paperclip
                                        size={14}
                                        className="text-slate-500 dark:text-slate-300"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate max-w-[100px] text-[10px]">
                                        {msg.attachment.name}
                                      </p>
                                      <span className="text-[9px] opacity-70">
                                        File
                                      </span>
                                    </div>
                                    <a
                                      href={msg.attachment.url}
                                      download={msg.attachment.name}
                                      className="p-1 hover:bg-black/10 rounded-full cursor-pointer"
                                    >
                                      <Download size={12} />
                                    </a>
                                  </div>
                                )
                              ) : (
                                <p className="leading-snug">{msg.text}</p>
                              )}
                              {(() => {
                                // console.log("RAW FROM API:", msg.time);
                                // console.log("BROWSER LOCAL:", new Date(msg.time).toString());
                                return null;
                              })()}
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <p
                                  className={`text-[7px] text-right opacity-70 leading-none ${msg.isMe
                                    ? "text-slate-300"
                                    : "text-slate-400"
                                    }`}
                                >
                                  {formatTime(msg.time)}
                                </p>
                                {msg.isMe &&
                                  (msg.isRead ? (
                                    <CheckCheck
                                      className="w-3 h-3 text-blue-300 "
                                      stroke="black"
                                    />
                                  ) : (
                                    <Check
                                      className="w-3 h-3 text-slate-300 opacity-70"
                                      stroke="black"
                                    />
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input */}
              <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 relative">
                {/* Hidden Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileChange(e, false)}
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, true)}
                />

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 w-72 h-64 z-50">
                    <div className="text-xs font-semibold text-slate-500 mb-2 px-2">
                      Emojis
                    </div>
                    <div className="grid grid-cols-8 gap-1 h-56 overflow-y-auto">
                      {COMMON_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(emoji)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex gap-2 items-end"
                >
                  {/* Desktop Actions */}
                  <div className="hidden md:flex gap-1 mb-2">
                    <Button
                      type="button"
                      onClick={triggerGenericFileUpload}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <Paperclip size={18} />
                    </Button>
                    <Button
                      type="button"
                      onClick={triggerImageUpload}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <ImageIcon size={18} />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 cursor-pointer ${showEmojiPicker
                        ? "text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        }`}
                    >
                      <Smile size={18} />
                    </Button>
                  </div>

                  {/* Mobile Actions (Plus Menu) */}
                  <div className="md:hidden mb-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          <Plus size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="top"
                        className="w-48 dark:bg-slate-950 dark:border-slate-800 mb-2"
                      >
                        <DropdownMenuItem
                          onClick={triggerGenericFileUpload}
                          className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-900"
                        >
                          <Paperclip className="mr-2 h-4 w-4" /> Attach File
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={triggerImageUpload}
                          className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-900"
                        >
                          <ImageIcon className="mr-2 h-4 w-4" /> Upload Image
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-900"
                        >
                          <Smile className="mr-2 h-4 w-4" /> Emoji
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Input
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-slate-400 min-h-11 text-slate-900 dark:text-white"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="h-11 w-11 rounded-xl bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white shrink-0 cursor-pointer"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 h-full">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <MessageSquare
                  size={40}
                  className="text-slate-300 dark:text-slate-600"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to Auto Computation
              </h3>
              <p className="max-w-xs text-center text-slate-500">
                Select a chat from the sidebar to start messaging.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* --- MODALS --- */}

      {/* 1. Create Group/Space Modal (With Custom Checkbox List) */}
      {(modalType === "create-group" || modalType === "create-space") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <form
              onSubmit={handleCreateConfirm}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalType === "create-group"
                    ? "Create New Group"
                    : "Create New Space"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Name
                  </label>
                  <Input
                    autoFocus
                    placeholder="e.g. Marketing Team"
                    value={modalInputValue}
                    onChange={(e) => setModalInputValue(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Add Members
                  </label>
                  <ScrollArea className="h-48 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                    {employees.map((emp) => {
                      const isSelected = selectedMembers.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                            ? "bg-slate-100 dark:bg-slate-800"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          onClick={() => toggleMemberSelection(emp.id)}
                        >
                          {/* Custom Checkbox */}
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                              ? "bg-slate-900 border-slate-900 dark:bg-green-600 dark:border-green-600"
                              : "border-slate-300 dark:border-slate-600"
                              }`}
                          >
                            {isSelected && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>

                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                              {emp.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {emp.role}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>
                  <p className="text-xs text-slate-400 mt-2 text-right">
                    {selectedMembers.length} selected
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalType(null)}
                  className="dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!modalInputValue.trim()}
                  className="bg-slate-900 dark:bg-green-600 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Create
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 3. Delete Confirmation */}
      {modalType === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle
                className="text-red-600 dark:text-red-500"
                size={24}
              />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {activeChat?.type !== "direct" ? "Remove Chat?" : "Delete Chat?"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {activeChat?.type !== "direct"
                ? "Are you sure you want to remove this chat? You will be removed from the group."
                : "This action cannot be undone."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setModalType(null)}
                className="flex-1 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {activeChat?.type !== "direct" ? "Remove" : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Action Confirmation Modal */}
      {modalType === "confirm-action" && pendingAction && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              {pendingAction.type === "remove" ? (
                <UserMinus className="text-red-500" size={24} />
              ) : (
                <ShieldCheck className="text-indigo-500" size={24} />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {pendingAction.type === "remove"
                ? "Remove Member?"
                : "Make Admin?"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to{" "}
              {pendingAction.type === "remove" ? "remove" : "promote"}{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {employees.find((e) => e.id === pendingAction.memberId)?.name}
              </span>
              ?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalType("chat-info");
                  setPendingAction(null);
                }}
                className="flex-1 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={executeConfirmation}
                className={`flex-1 text-white cursor-pointer ${pendingAction.type === "remove"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
              >
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 5. Chat Info Modal */}
      {modalType === "chat-info" && activeChat && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <button
                onClick={() => setModalType(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full cursor-pointer"
              >
                <X size={20} className="text-slate-500" />
              </button>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Contact Info
              </h3>
            </div>

            {/* Profile Section */}
            <div className="p-8 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
              <Avatar className="h-32 w-32 mb-4 ring-4 ring-slate-50 dark:ring-slate-900 shadow-xl">
                <AvatarImage src={activeChat.avatar} />
                <AvatarFallback className="text-4xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {activeChat.type === "space" ? (
                    <Hash size={48} />
                  ) : activeChat.type === "group" ? (
                    <Users size={48} />
                  ) : (
                    activeChat.name.substring(0, 2).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-1 mb-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeChat.name}
                </h2>
                {activeChat.type !== "direct" && (
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${activeChat.type === "space"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-orange-600 dark:text-orange-400"
                      }`}
                  >
                    {activeChat.type}
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {activeChat.type === "direct"
                  ? activeChat.phone || "No phone provided"
                  : `${activeChat.members?.length || 0} members`}
              </p>
              {activeChat.type === "direct" && activeChat.email && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {activeChat.email}
                </p>
              )}

              <div className="flex gap-6 mt-8 w-full justify-center">
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                    <Search size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Search
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Report
                  </span>
                </div>
              </div>
            </div>

            {/* Members Section (Group/Space Only) */}
            {activeChat.type !== "direct" && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {activeChat.members?.length || 0} Members
                  </h4>
                  {/* Add Member Button - Only if Admin */}
                  {currentUser &&
                    activeChat.admins?.includes(String(currentUser.id)) && (
                      <button
                        onClick={() => {
                          setSelectedMembers([]);
                          setModalType("add-member");
                        }}
                        className="text-xs flex items-center gap-1 text-slate-900 dark:text-green-400 font-medium hover:underline cursor-pointer"
                      >
                        <UserPlus size={14} /> Add Member
                      </button>
                    )}
                </div>
                <div className="space-y-3">
                  {activeChat.members?.map((memberId) => {
                    // Handle "me" which is not in employees list
                    let member = employees.find((e) => e.id === memberId);
                    if (
                      String(memberId) === String(currentUser?.id) &&
                      currentUser
                    ) {
                      member = currentUser;
                    }
                    if (!member) {
                      member = {
                        id: memberId,
                        name: "Unknown",
                        role: "Member",
                      };
                    }

                    const isAdmin = activeChat.admins?.includes(memberId);
                    const isMeAdmin =
                      currentUser &&
                      activeChat.admins?.includes(String(currentUser.id));

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-xs">
                              {member.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              {member.name}
                              {isAdmin && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium flex items-center gap-0.5">
                                  <Crown size={8} /> Admin
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.role}
                            </p>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        {isMeAdmin && memberId !== "me" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="dark:bg-slate-950 dark:border-slate-800"
                            >
                              {!isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => handleMakeAdmin(memberId)}
                                  className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-900"
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" /> Make
                                  Admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(memberId)}
                                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                              >
                                <UserMinus className="mr-2 h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Section */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Media & Docs
                </h4>
                <span className="text-slate-400 text-xs flex items-center gap-1 cursor-pointer hover:text-slate-600">
                  See all <ArrowLeft size={12} className="rotate-180" />
                </span>
              </div>
              {/* Filter messages for attachments */}
              {(() => {
                const attachments = messages.filter((m) => m.attachment);
                if (attachments.length === 0)
                  return (
                    <p className="text-sm text-slate-400 py-4 text-center">
                      No media shared
                    </p>
                  );

                return (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.slice(0, 6).map((m) =>
                      m.attachment?.type === "image" ? (
                        <div
                          key={m.id}
                          className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative group cursor-pointer"
                        >
                          <img
                            src={m.attachment.url}
                            className="w-full h-full object-cover"
                            alt="media"
                          />
                        </div>
                      ) : (
                        <div
                          key={m.id}
                          className="aspect-square rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 text-center cursor-pointer"
                        >
                          <Paperclip
                            size={20}
                            className="text-slate-400 mb-1"
                          />
                          <span className="text-[10px] text-slate-500 truncate w-full">
                            {m.attachment?.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Other Actions */}
            <div className="p-4 space-y-1">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-left cursor-pointer">
                <MoreVertical size={20} className="text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Chat Settings
                </span>
              </button>
              <button
                onClick={initiateDelete}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left cursor-pointer group"
              >
                <Trash2
                  size={20}
                  className="text-red-500 group-hover:text-red-600"
                />
                <span className="text-red-500 group-hover:text-red-600 font-medium">
                  {activeChat.type !== "direct" ? "Remove Chat" : "Delete Chat"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 5. Add Member Modal */}
      {modalType === "add-member" && activeChat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <form onSubmit={handleAddMembers} className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add Members
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMembers([]);
                    setModalType("chat-info");
                  }}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                  Select contacts to add
                </label>
                <ScrollArea className="h-64 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {employees
                    .filter((emp) => !activeChat.members?.includes(emp.id))
                    .map((emp) => {
                      const isSelected = selectedMembers.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected
                            ? "bg-slate-100 dark:bg-slate-800"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          onClick={() => toggleMemberSelection(emp.id)}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                              ? "bg-slate-900 border-slate-900 dark:bg-green-600 dark:border-green-600"
                              : "border-slate-300 dark:border-slate-600"
                              }`}
                          >
                            {isSelected && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                              {emp.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {emp.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {emp.role}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  {employees.filter(
                    (emp) => !activeChat.members?.includes(emp.id)
                  ).length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-8">
                        All available contacts are already in this chat.
                      </p>
                    )}
                </ScrollArea>
                <p className="text-xs text-slate-400 mt-2 text-right">
                  {selectedMembers.length} selected
                </p>
              </div>

              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMembers([]);
                    setModalType("chat-info");
                  }}
                  className="dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={selectedMembers.length === 0}
                  className="bg-slate-900 dark:bg-green-600 text-white hover:bg-slate-800 cursor-pointer"
                >
                  Add Members
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Chats;
