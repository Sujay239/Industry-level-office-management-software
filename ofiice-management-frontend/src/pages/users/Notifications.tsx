import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  Clock,
  Trash2,
  // Mail,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  // Filter,
  MailOpen,
} from "lucide-react";

// --- Types ---
type NotificationType = "info" | "success" | "warning" | "alert";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
  dateGroup: "Today" | "Yesterday" | "Earlier";
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  // Helper to format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  // Helper to get date group
  const getDateGroup = (dateString: string): "Today" | "Yesterday" | "Earlier" => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date >= today) return "Today";
    if (date >= yesterday) return "Yesterday";
    return "Earlier";
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/notifications/all`, {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        // Backend returns { Notifications: [...] }
        const mapped = (data.Notifications || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: formatTimeAgo(n.created_at),
          type: n.type,
          read: n.is_read || false, // Assuming backend uses is_read
          dateGroup: getDateGroup(n.created_at)
        }));
        setNotifications(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // --- Actions ---
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/notifications/mark-read/all`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/notifications/delete/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/notifications/mark-read/${id}`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  // --- Helpers ---
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "alert":
        return <AlertCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
      case "warning":
        return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
      case "alert":
        return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  // --- Filtering & Grouping ---
  const filteredNotifications =
    filter === "all" ? notifications : notifications.filter((n) => !n.read);

  const groupedNotifications = {
    Today: filteredNotifications.filter((n) => n.dateGroup === "Today"),
    Yesterday: filteredNotifications.filter((n) => n.dateGroup === "Yesterday"),
    Earlier: filteredNotifications.filter((n) => n.dateGroup === "Earlier"),
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="space-y-8">
        {/* --- Header Section --- */}
        {/* --- Header Section (Sticky) --- */}
        <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="mt-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 max-sm:hidden">
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
              Manage your alerts and activity updates.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg self-start md:self-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${filter === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white "
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "unread"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* --- Mark All Read Button (Conditional) --- */}
        {unreadCount > 0 && filter !== "unread" && (
          <div className="flex justify-end">
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check size={16} /> Mark all as read
            </button>
          </div>
        )}

        {/* --- Notifications List --- */}
        <div className="space-y-8">
          {(
            Object.entries(groupedNotifications) as [
              keyof typeof groupedNotifications,
              Notification[]
            ][]
          ).map(
            ([group, items]) =>
              items.length > 0 && (
                <div key={group} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {group}
                    </span>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {items.map((notification) => (
                      <div
                        key={notification.id}
                        className={`
                        group relative flex flex-col sm:flex-row gap-4 p-5 rounded-xl border transition-all duration-300
                        ${notification.read
                            ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                            : "bg-white dark:bg-slate-950 border-l-4 border-l-green-500 border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm"
                          }
                        hover:shadow-md dark:hover:bg-slate-900
                      `}
                      >
                        {/* Icon */}
                        <div
                          className={`
                        shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1
                        ${getStyles(notification.type)}
                      `}
                        >
                          {getIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3
                                className={`text-base font-semibold ${notification.read
                                  ? "text-slate-600 dark:text-slate-400"
                                  : "text-slate-900 dark:text-white"
                                  }`}
                              >
                                {notification.title}
                              </h3>
                              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                {notification.message}
                              </p>
                            </div>

                            {/* Actions (Desktop - Hover Only) */}
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all cursor-pointer"
                                  title="Mark as read"
                                >
                                  <MailOpen size={18} />
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} />
                              <span>{notification.time}</span>
                            </div>
                            {!notification.read && (
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (Mobile - Always Visible Row) */}
                        <div className="flex sm:hidden items-center justify-end gap-3 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-green-600"
                            >
                              <MailOpen size={14} />
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}

          {/* --- Empty State --- */}
          {filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-4">
                <Bell className="text-slate-300 dark:text-slate-600" size={48} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No notifications
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                {filter === "unread"
                  ? "You're all caught up! No unread alerts."
                  : "You have no notifications at this time."}
              </p>
              {filter === "unread" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 text-sm font-medium text-green-600 hover:underline"
                >
                  View all notifications
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
