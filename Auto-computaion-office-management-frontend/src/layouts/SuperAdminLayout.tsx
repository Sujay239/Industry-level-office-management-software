import { Outlet, useLocation } from "react-router-dom";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  CheckSquare,
  Users,
  MessageSquare,
  Calendar,
} from "lucide-react";
import MobileBottomNav from "../components/MobileBottomNav";

const SuperAdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/super-admin" || path === "/super-admin/") return "Dashboard";
    if (path.includes("/tasks")) return "Tasks";
    if (path.includes("/employees")) return "Employees";
    if (path.includes("/attendance")) return "Attendance";
    if (path.includes("/meetings")) return "Meetings";
    if (path.includes("/holidays")) return "Holidays";
    if (path.includes("/chats")) return "Chats";
    if (path.includes("/payroll")) return "Payroll";
    if (path.includes("/leaves")) return "Leaves";
    if (path.includes("/manage-admins")) return "Admins";
    if (path.includes("/departments")) return "Departments";
    if (path.includes("/settings")) return "Settings";
    if (path.includes("/past-employees")) return "Past Employees";
    if (path.includes("/audit-logs")) return "Audit Logs";
    return "Office App";
  };

  const navItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/super-admin",
      end: true,
    },
    { icon: CheckSquare, label: "Tasks", path: "/super-admin/tasks" },
    { icon: Users, label: "Attendance", path: "/super-admin/attendance" },
    { icon: MessageSquare, label: "Chats", path: "/super-admin/chats" },
    { icon: Calendar, label: "Meetings", path: "/super-admin/meetings" },
  ];

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col lg:flex-row overflow-hidden text-sm md:text-base">
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

      <SuperAdminSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="flex-1 w-full mx-auto overflow-x-hidden overflow-y-auto relative p-0 mb-16 lg:mb-0">
        <Outlet context={{ setShowMobileHeader }} />
      </main>
      <MobileBottomNav items={navItems} />
    </div>
  );
};

export default SuperAdminLayout;
