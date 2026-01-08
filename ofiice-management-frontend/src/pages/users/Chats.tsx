
import React, { useState, useRef, useEffect } from "react";
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
  //   Settings,
  Smile,
  Trash2,
  //   Info,
  X,
  AlertTriangle,
  Check,
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
  DropdownMenuLabel
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
  isSystem?: boolean;
  attachment?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  };
}

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
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
  role?: string; // Added role
  otherUserId?: string; // Added to identify DM target
}

// --- Constants ---
const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
  "😋", "😛", "jg", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎",
  "🤩", "🥳", "😏", "😒", "😞", "😔", "ww", "😕", "🙁", "☹️",
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
  "🤬", "🤯", "😳", "🥵", "🥶", "😱", "mw", "😨", "🤔", "🤗",
  "👍", "👎", "👊", "✌️", "👌", "✋", "💪", "🙏", "🔥", "✨",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💯", "🎉"
];

const formatTime = (dbDateString?: string) => {
  if (!dbDateString) return '';

  try {
    const date = new Date(dbDateString.endsWith('Z') ? dbDateString : dbDateString + ' UTC');
    if (isNaN(date.getTime())) return dbDateString;

    // Manually add 5 hours and 30 minutes (IST Offset)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);

    // Print the components manually using UTC methods (since we already shifted the time)
    let hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const strMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${hours}:${strMinutes} ${ampm}`;
  } catch (e) {
    return dbDateString;
  }
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Modal State
  const [modalType, setModalType] = useState<'create-group' | 'create-space' | 'delete' | 'chat-info' | 'add-member' | 'confirm-action' | null>(null);
  const [modalInputValue, setModalInputValue] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{ type: 'remove' | 'admin', memberId: string } | null>(null);
  // Call status removed

  const { showSuccess, showError } = useNotification();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // For generic files
  const imageInputRef = useRef<HTMLInputElement>(null); // For images only

  const socket = useRef<any>(null);

  // Refs for tracking state inside socket listeners (to avoid stale closures without re-binding)
  const activeChatRef = useRef<ChatContact | null>(null);
  const currentUserIdRef = useRef<number | null>(null);

  // Keep refs synced with state
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // --- Effects ---

  // 1. Initialize Socket and Fetch Contacts & Get Current User
  useEffect(() => {
    // Fetch Current User
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/myData`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data.user.id);
        }
      } catch (e) {
        console.error("Failed to fetch current user", e);
      }
    };
    fetchCurrentUser();

    // Fetch Contacts
    const fetchContacts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    };

    fetchContacts();


    // Fetch Employees
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats/users`, {
          credentials: 'include'
        });
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
    socket.current = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
      withCredentials: true,
    });

    socket.current.on("connect", () => {
      console.log("Connected to socket");
    });

    socket.current.on("receive_message", (message: Message & { chatId: string }) => {
      // Update contacts (last message) - this should always happen
      setContacts(prev => prev.map(c => {
        if (c.id === message.chatId) {
          const isMe = currentUserIdRef.current ? String(message.senderId) === String(currentUserIdRef.current) : false;
          const isActive = activeChatRef.current && activeChatRef.current.id === message.chatId;

          // If I sent it, unread count shouldn't increase.
          // If I am receiving it and it's active, unread count is 0.
          // If I am receiving it and it's NOT active, unread count increases.

          let newUnread = c.unread || 0;
          if (isMe) {
            // Keep it same or 0?
            // If I send a message, I've read the chat.
            // But theoretically I could have unread messages above it?
            // Usually if I send a message, I am active in the chat, so unread should be 0.
            // But let's check isActive.
            // If I am sending, I am likely active.
            // If for some reason I am not active (api call?), I still shouldn't increment my own unread.
            // Safest: if isMe, keep as is (assuming I read it or it doesn't count).
            // ACTUALLY: If I send a message, I must be viewing the chat. So unread should be 0.
            newUnread = 0;
          } else {
            if (isActive) {
              newUnread = 0;
            } else {
              newUnread = (c.unread || 0) + 1;
            }
          }

          return {
            ...c,
            lastMessage: message.text,
            time: message.time,
            unread: newUnread
          };
        }
        return c;
      }));
    });

    // Online status listeners
    socket.current.on("online_users", (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    socket.current.on("user_online", (userId: string) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    socket.current.on("user_offline", (userId: string) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  // 2. Handle Message Reception specifically for Active Chat appending
  useEffect(() => {
    if (!socket.current) return;

    const handler = (message: Message & { chatId: string }) => {
      if (activeChat && message.chatId === activeChat.id) {
        setMessages(prev => {
          // Avoid duplicates if we optimistically updated (checking ID)
          if (prev.some(m => m.id === message.id)) return prev;

          // Determine isMe based on currentUserId
          const isMe = currentUserId ? String(message.senderId) === String(currentUserId) : false;

          return [...prev, { ...message, isMe }];
        });
      }
    };

    // We need to attach this listener every time activeChat changes to capture closure,
    // OR use a ref for activeChat.
    // Socket.io listeners can stack if not cleaned up.
    socket.current.on("receive_message", handler);

    return () => {
      socket.current.off("receive_message", handler);
    }
  }, [activeChat, currentUserId]); // Depend on currentUserId as well


  // 3. Join Chat Room & Fetch Messages when Active Chat Changes
  useEffect(() => {
    if (activeChat) {
      // Fetch Messages
      const fetchMessages = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats/${activeChat.id}/messages`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      };
      fetchMessages();

      // Join Room
      socket.current.emit("join_chat", activeChat.id);

      setShowEmojiPicker(false);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // --- Handlers ---

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    // Optimistic Update is tricky without ID from backend, but we can trust socket echo or separate local append.
    // Let's emit and wait for socket echo to append, OR append locally and ignore echo if ID matches.
    // For now, simpler: Emit.
    // And for immediate feedback, append locally.

    // Emit
    if (activeChat && socket.current) {
      socket.current.emit("send_message", {
        chatId: activeChat.id,
        senderId: currentUserId ? currentUserId : "me", // Send real ID if available, though backend uses socket auth now
        text: messageInput,
      });

      // Optimistic Update: Append locally immediately
      // We don't have the real ID yet (backend generates it), so we use a temp ID.
      // But ensure we don't duplicate when the real echo comes back.
      // Or just wait for echo? User says "not showing... sending".
      // Echo is fast usually. If we depend on echo, we rely on isMe calculation above.
      // The issue was simply that isMe was false in the echo.
      // So fixing the echo handler should fix "not showing my side" (it was showing on left).
    }

    setMessageInput("");
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  // --- Modal & Creation Handlers ---
  const openCreateModal = (type: 'group' | 'space') => {
    setModalType(type === 'group' ? 'create-group' : 'create-space');
    setModalInputValue("");
    setSelectedMembers([]);
  };

  const toggleMemberSelection = (employeeId: string) => {
    setSelectedMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleCreateConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalInputValue.trim()) return;

    const type = modalType === 'create-group' ? 'group' : 'space';

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: modalInputValue,
          type,
          members: selectedMembers
        })
      });

      if (res.ok) {
        const newChat = await res.json();
        setContacts([newChat, ...contacts]);
        setActiveChat(newChat);
        setModalType(null);
        showSuccess(`${type === 'group' ? 'Group' : 'Space'} "${modalInputValue}" created successfully!`);
      } else {
        showError("Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating chat", error);
    }
  };

  const initiateDelete = () => setModalType('delete');

  const confirmDelete = () => {
    if (activeChat) {
      setContacts(contacts.filter(c => c.id !== activeChat.id));
      setActiveChat(null);
      setModalType(null);
    }
  };

  // --- Group Admin Handlers ---
  const handleRemoveMember = (memberId: string) => {
    setPendingAction({ type: 'remove', memberId });
    setModalType('confirm-action');
  };

  const handleMakeAdmin = (memberId: string) => {
    setPendingAction({ type: 'admin', memberId });
    setModalType('confirm-action');
  };

  const executeConfirmation = () => {
    if (!activeChat || !pendingAction) return;
    const { type, memberId } = pendingAction;

    let updatedChat = { ...activeChat };
    let sysMsgText = '';

    if (type === 'remove') {
      if (!activeChat.members) return;
      updatedChat.members = activeChat.members.filter(id => id !== memberId);
      sysMsgText = 'Member removed';
      showSuccess("Member removed successfully!");
    } else if (type === 'admin') {
      const currentAdmins = activeChat.admins || [];
      if (currentAdmins.includes(memberId)) return;
      updatedChat.admins = [...currentAdmins, memberId];
      sysMsgText = 'Member promoted to Admin';
      showSuccess("Member promoted to admin successfully!");
    }

    setActiveChat(updatedChat);
    setContacts(contacts.map(c => c.id === activeChat.id ? updatedChat : c));

    const sysMsg: Message = {
      id: Date.now(),
      senderId: 'system',
      text: sysMsgText,
      time: 'Now',
      isMe: false,
      isSystem: true
    };
    setMessages(prev => [...prev, sysMsg]);

    setModalType('chat-info'); // Return to info modal
    setPendingAction(null);
  };

  const handleAddMembers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !activeChat.members) return;

    const newMembers = selectedMembers.filter(id => !activeChat.members?.includes(id));
    if (newMembers.length === 0) {
      setModalType('chat-info');
      return;
    }

    const updatedChat = { ...activeChat, members: [...activeChat.members, ...newMembers] };
    setActiveChat(updatedChat);
    setContacts(contacts.map(c => c.id === activeChat.id ? updatedChat : c));
    setModalType('chat-info');
    setSelectedMembers([]);

    // System message
    const sysMsg: Message = {
      id: Date.now(),
      senderId: 'system',
      text: `${newMembers.length} new member(s) added`,
      time: new Date().toISOString(),
      isMe: false,
      isSystem: true
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  // Call handlers removed

  // --- File Upload Handlers ---
  const triggerGenericFileUpload = () => fileInputRef.current?.click();

  const triggerImageUpload = () => imageInputRef.current?.click(); // Triggers the image specific input

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Note: Real app should upload file and get URL.
      // Here we emit a placeholder message.
      if (activeChat && socket.current) {
        socket.current.emit("send_message", {
          chatId: activeChat.id,
          senderId: "me",
          text: `[${isImage ? 'Image' : 'File'} Upload Placeholder: ${file.name}]`,
        });
      }
    }
  };

  // Merge contacts and employees
  const allDisplayContacts = React.useMemo(() => {
    // Start with existing contacts
    const displayList = [...contacts];

    // Add employees who are not in contacts
    // We check if an employee ID exists as 'otherUserId' in any direct chat
    employees.forEach(emp => {
      // Backend getUsers filters out 'me', so we don't need to check that.

      // Check if exists in contacts.
      // Important: Use String() for comparison to handle potential number/string mismatches.
      // Also ensure we only check against 'direct' chats.
      const exists = contacts.some(c =>
        c.type === 'direct' && String(c.otherUserId) === String(emp.id)
      );

      if (!exists) {
        displayList.push({
          id: `temp_${emp.id}`, // Virtual ID
          name: emp.name || "Unknown",
          avatar: emp.avatar,
          type: 'direct',
          lastMessage: '',
          time: '',
          unread: 0,
          otherUserId: String(emp.id),
          role: emp.role
        });
      }
    });

    // Sort: Real chats with recent messages first
    return displayList.sort((a, b) => {
      // If one has time and other doesn't, the one with time comes first
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;

      // If both have time, rely on existing order (or we could try to parse time if formats are consistent)
      // Existing order from backend is reliable for active chats.
      if (a.time && b.time) return 0;

      // If neither has time (both are virtual contacts), sort alphabetically
      const nameA = a.name || "Unknown";
      const nameB = b.name || "Unknown";
      return nameA.localeCompare(nameB);
    });

  }, [contacts, employees]);

  const filteredContacts = allDisplayContacts.filter(c =>
    (c.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle clicking a contact
  const handleContactClick = async (contact: ChatContact) => {
    if (String(contact.id).startsWith('temp_') && contact.otherUserId) {
      // It's a virtual contact. Create or Get real chat.
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats/dm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: contact.otherUserId }),
          credentials: 'include'
        });
        if (res.ok) {
          const { chatId } = await res.json();
          // Now we have a real chat ID.
          // Update contact in list to be real.

          // Is it already in contacts? logic says no (filtered).
          // So we add it.
          const newRealContact: ChatContact = {
            ...contact,
            id: String(chatId),
            type: 'direct',
            unread: 0
          };

          // Remove temp prefix if any

          setContacts(prev => [newRealContact, ...prev]);
          setActiveChat(newRealContact);
        }
      } catch (e) {
        console.error("Error starting chat", e);
      }
    } else {
      setActiveChat(contact);

      // Mark as read locally
      setContacts(prev => prev.map(c =>
        c.id === contact.id ? { ...c, unread: 0 } : c
      ));

      // Mark as read on backend
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chats/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: contact.id }),
          credentials: 'include'
        });
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
          : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent"}
      `}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
          <AvatarImage src={contact.avatar} />
          <AvatarFallback className={`text-xs font-bold ${contact.type === 'space' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : contact.type === 'group' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
            {contact.type === 'space' ? <Hash size={16} /> : contact.type === 'group' ? <Users size={16} /> : (contact.name || "?").substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {contact.type === 'direct' && contact.otherUserId && onlineUsers.has(String(contact.otherUserId)) && (
          // Online indicator (real-time)
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {contact.name || "Unknown"}
          </p>
          {contact.time && <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatTime(contact.time)}</span>}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
            {/* Show current typing status or last message or designation */}
            {contact.lastMessage ? (
              contact.lastMessage
            ) : (
              <span className="text-slate-400 italic">{contact.role || 'Available'}</span>
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
    <div className="p-0 lg:p-1 sm:-mx-6 lg:-mx-8 h-screen flex flex-col animate-in fade-in duration-500 lg:mt-0">
      <Card className="flex-1 flex overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-950 h-full">
        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`
            w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-950
            ${activeChat ? "hidden md:flex" : "flex"}
        `}
        >
          {/* Header (Sticky & Mobile Optimized) */}
          {/* Header (Sticky & App-like) */}
          <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50 shadow-sm transition-all pb-4 pt-4">

            {/* Title Row: Standard Alignment */}
            <div className="flex items-center justify-between px-4 pb-2 pr-16 md:pr-4 relative min-h-10">
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
                    <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
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
                    onClick={() => setModalType('chat-info')}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">
                        {activeChat.name}
                      </h3>
                      {activeChat.type === 'group' && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-none">Group</Badge>}
                      {activeChat.type === 'space' && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-none">Space</Badge>}
                    </div>
                    {activeChat.type === "direct" ? (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />{" "}
                        Online
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
                  {/* Call buttons removed */}
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
                        onClick={initiateDelete}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-black/20">
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
                            <Avatar className="h-8 w-8 mb-1 hidden sm:block">
                              <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                {activeChat.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`p-3 rounded-2xl text-sm shadow-sm ${msg.isMe
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
                                    className="max-w-[200px] sm:max-w-xs rounded-lg border border-white/10"
                                  />
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                                    title="Download Image"
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 bg-black/5 dark:bg-black/20 p-2 rounded-lg mb-1">
                                  <div className="p-2 bg-white dark:bg-slate-700 rounded-lg">
                                    <Paperclip
                                      size={20}
                                      className="text-slate-500 dark:text-slate-300"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate max-w-[150px]">
                                      {msg.attachment.name}
                                    </p>
                                    <span className="text-xs opacity-70">
                                      File
                                    </span>
                                  </div>
                                  <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="p-2 hover:bg-black/10 rounded-full cursor-pointer"
                                  >
                                    <Download size={16} />
                                  </a>
                                </div>
                              )
                            ) : (
                              <p className="leading-relaxed">{msg.text}</p>
                            )}
                            <p
                              className={`text-[10px] mt-1 text-right opacity-70 ${msg.isMe ? "text-slate-300" : "text-slate-400"
                                }`}
                            >
                              {formatTime(msg.time)}
                            </p>
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
                    onChange={(e) => setMessageInput(e.target.value)}
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
              Delete Chat?
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              This action cannot be undone.
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
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Action Confirmation Modal */}
      {modalType === 'confirm-action' && pendingAction && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
            <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
              {pendingAction.type === 'remove' ? <UserMinus className="text-red-500" size={24} /> : <ShieldCheck className="text-indigo-500" size={24} />}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {pendingAction.type === 'remove' ? 'Remove Member?' : 'Make Admin?'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Are you sure you want to {pendingAction.type === 'remove' ? 'remove' : 'promote'} <span className="font-semibold text-slate-900 dark:text-white">{employees.find(e => e.id === pendingAction.memberId)?.name}</span>?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setModalType('chat-info'); setPendingAction(null); }} className="flex-1 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 cursor-pointer">Cancel</Button>
              <Button onClick={executeConfirmation} className={`flex-1 text-white cursor-pointer ${pendingAction.type === 'remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 5. Chat Info Modal */}
      {modalType === 'chat-info' && activeChat && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <button onClick={() => setModalType(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full cursor-pointer">
                <X size={20} className="text-slate-500" />
              </button>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Contact Info</h3>
            </div>

            {/* Profile Section */}
            <div className="p-8 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
              <Avatar className="h-32 w-32 mb-4 ring-4 ring-slate-50 dark:ring-slate-900 shadow-xl">
                <AvatarImage src={activeChat.avatar} />
                <AvatarFallback className="text-4xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {activeChat.type === 'space' ? <Hash size={48} /> : activeChat.type === 'group' ? <Users size={48} /> : activeChat.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-1 mb-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{activeChat.name}</h2>
                {activeChat.type !== 'direct' && (
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeChat.type === 'space' ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {activeChat.type}
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {activeChat.type === 'direct' ? '+1 234 567 890' : `${activeChat.members?.length || 0} members`}
              </p>
              {activeChat.type === 'direct' && activeChat.email && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {activeChat.email}
                </p>
              )}

              <div className="flex gap-6 mt-8 w-full justify-center">
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                    <Search size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Search</span>
                </div>
                <div className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Report</span>
                </div>
              </div>
            </div>

            {/* Members Section (Group/Space Only) */}
            {activeChat.type !== 'direct' && (
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {activeChat.members?.length || 0} Members
                  </h4>
                  {/* Add Member Button - Only if Admin */}
                  {activeChat.admins?.includes('me') && (
                    <button
                      onClick={() => { setSelectedMembers([]); setModalType('add-member'); }}
                      className="text-xs flex items-center gap-1 text-slate-900 dark:text-green-400 font-medium hover:underline cursor-pointer"
                    >
                      <UserPlus size={14} /> Add Member
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {activeChat.members?.map(memberId => {
                    const member = employees.find(e => e.id === memberId) || { id: memberId, name: 'Unknown', role: 'Member' };
                    const isAdmin = activeChat.admins?.includes(memberId);
                    const isMeAdmin = activeChat.admins?.includes('me');

                    return (
                      <div key={memberId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-xs">
                              {member.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              {member.name}
                              {isAdmin && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium flex items-center gap-0.5"><Crown size={8} /> Admin</span>}
                            </p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        {isMeAdmin && memberId !== 'me' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <MoreVertical size={16} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-slate-950 dark:border-slate-800">
                              {!isAdmin && (
                                <DropdownMenuItem onClick={() => handleMakeAdmin(memberId)} className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-900">
                                  <ShieldCheck className="mr-2 h-4 w-4" /> Make Admin
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleRemoveMember(memberId)} className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
                                <UserMinus className="mr-2 h-4 w-4" /> Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Media Section */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Media & Docs</h4>
                <span className="text-slate-400 text-xs flex items-center gap-1 cursor-pointer hover:text-slate-600">See all <ArrowLeft size={12} className="rotate-180" /></span>
              </div>
              {/* Filter messages for attachments */}
              {(() => {
                const attachments = messages.filter(m => m.attachment);
                if (attachments.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No media shared</p>;

                return (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.slice(0, 6).map(m => (
                      m.attachment?.type === 'image' ? (
                        <div key={m.id} className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative group cursor-pointer">
                          <img src={m.attachment.url} className="w-full h-full object-cover" alt="media" />
                        </div>
                      ) : (
                        <div key={m.id} className="aspect-square rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-2 text-center cursor-pointer">
                          <Paperclip size={20} className="text-slate-400 mb-1" />
                          <span className="text-[10px] text-slate-500 truncate w-full">{m.attachment?.name}</span>
                        </div>
                      )
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Other Actions */}
            <div className="p-4 space-y-1">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors text-left cursor-pointer">
                <MoreVertical size={20} className="text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Chat Settings</span>
              </button>
              <button className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-left cursor-pointer group">
                <Trash2 size={20} className="text-red-500 group-hover:text-red-600" />
                <span className="text-red-500 group-hover:text-red-600 font-medium">Delete Chat</span>
              </button>
            </div>

          </div>
        </div>
      )}
      {/* 5. Add Member Modal */}
      {modalType === 'add-member' && activeChat && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <form onSubmit={handleAddMembers} className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Members</h3>
                <button type="button" onClick={() => { setSelectedMembers([]); setModalType('chat-info'); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
              </div>

              <div className="p-6 overflow-y-auto">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">Select contacts to add</label>
                <ScrollArea className="h-64 rounded-md border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                  {employees.filter(emp => !activeChat.members?.includes(emp.id)).map((emp) => {
                    const isSelected = selectedMembers.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        onClick={() => toggleMemberSelection(emp.id)}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-slate-900 border-slate-900 dark:bg-green-600 dark:border-green-600' : 'border-slate-300 dark:border-slate-600'}`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                            {emp.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{emp.role}</p>
                        </div>
                      </div>
                    );
                  })}
                  {employees.filter(emp => !activeChat.members?.includes(emp.id)).length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-8">All available contacts are already in this chat.</p>
                  )}
                </ScrollArea>
                <p className="text-xs text-slate-400 mt-2 text-right">{selectedMembers.length} selected</p>
              </div>

              <div className="p-6 pt-0 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => { setSelectedMembers([]); setModalType('chat-info'); }} className="dark:text-slate-300 cursor-pointer">Cancel</Button>
                <Button type="submit" disabled={selectedMembers.length === 0} className="bg-slate-900 dark:bg-green-600 text-white hover:bg-slate-800 cursor-pointer">Add Members</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Chats;


