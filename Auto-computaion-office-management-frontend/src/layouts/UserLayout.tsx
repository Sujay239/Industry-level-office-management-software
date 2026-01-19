import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

import {
  Menu,
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Calendar,
  Settings,
} from "lucide-react";
import MobileBottomNav from "../components/MobileBottomNav";
import { AttendanceProvider } from "../components/AttendanceProvider";

const UserLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(true);

  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/user" || path === "/user/") return "Dashboard";
    if (path.includes("/tasks")) return "My Tasks";
    if (path.includes("/notifications")) return "Notifications";
    if (path.includes("/attendance")) return "My Attendance";
    if (path.includes("/chats")) return "Messages";
    if (path.includes("/leave/apply")) return "Apply for Leave";
    if (path.includes("/meetings")) return "My Meetings";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/payroll")) return "My Payroll";
    return "Office App";
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/user", end: true },
    { icon: CheckSquare, label: "Tasks", path: "/user/tasks" },
    { icon: MessageSquare, label: "Chats", path: "/user/chats" },
    { icon: Calendar, label: "Meetings", path: "/user/meetings" },
    { icon: Settings, label: "Settings", path: "/user/settings" },
  ];

  return (
    <AttendanceProvider>
      <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col lg:flex-row overflow-hidden">
        {/* --- Mobile Header --- */}
        {showMobileHeader && (
          <header className="lg:hidden h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-40 relative">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[150px]">
                {getPageTitle()}
              </span>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={24} />
            </button>
          </header>
        )}

        <UserSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Page content - Scrollable Area */}
        <main className="flex-1 w-full mx-auto overflow-x-hidden overflow-y-auto relative p-0 mb-16 lg:mb-0">
          <Outlet context={{ setShowMobileHeader }} />
        </main>
        <MobileBottomNav items={navItems} />
      </div>
    </AttendanceProvider>
  );
};

export default UserLayout;
