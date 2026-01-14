import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  CheckSquare,
  Bell,
  CalendarCheck,
  MessageSquare,
  FileText,
  LogOut,
  LogIn,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Timer,
  Wallet,
  Settings,
  CalendarDays,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useUser } from "./UserProvider";
import { useNotification } from "./NotificationProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Configuration ---
const logo = "/logo.png";
const mobileLogo = "/mobile-logo.png";

type NavItem = {
  label: string;
  to: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/user", icon: <Home size={20} /> },
  { label: "Tasks", to: "/user/tasks", icon: <CheckSquare size={20} /> },
  {
    label: "Notifications",
    to: "/user/notifications",
    icon: <Bell size={20} />,
  },
  {
    label: "Attendance",
    to: "/user/attendance",
    icon: <CalendarCheck size={20} />,
  },
  { label: "Chats", to: "/user/chats", icon: <MessageSquare size={20} /> },
  { label: "Payroll", to: "/user/payroll", icon: <Wallet size={20} /> },
  { label: "Apply Leave", to: "/user/leave", icon: <FileText size={20} /> },
  { label: "Meetings", to: "/user/meetings", icon: <CalendarCheck size={20} /> },
  { label: "Holidays", to: "/user/holidays", icon: <CalendarDays size={20} /> },
  { label: "Settings", to: "/user/settings", icon: <Settings size={20} /> },
];

interface UserSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;
  const { user } = useUser();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  // --- NEW: Attendance State Logic ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const { showSuccess, showError } = useNotification();

  // Sync with localStorage on mount (and periodically to stay in sync with Attendance Page)
  useEffect(() => {
    const checkStatus = () => {
      const status = localStorage.getItem("attendance_status");
      setIsCheckedIn(status === "clocked_in");
    };

    checkStatus(); // Initial check

    // Listen for storage events (if changed in another tab)
    window.addEventListener("storage", checkStatus);

    // Optional: Poll every second to catch changes made on Attendance Page within same tab
    const interval = setInterval(checkStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkStatus);
      clearInterval(interval);
    };
  }, []);

  const handleClockAction = async () => {
    if (isClockingIn) return;
    setIsClockingIn(true);

    try {
      if (!isCheckedIn) {
        // Clock In
        const response = await fetch(`${API_BASE_URL}/employee/dashboard/clock-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (response.ok) {
          await response.json();
          const now = Date.now();
          localStorage.setItem("attendance_status", "clocked_in");
          localStorage.setItem("attendance_start_time", now.toString());
          setIsCheckedIn(true);
          showSuccess("Clocked In Successfully!");
        } else {
          const errorData = await response.json();
          showError(errorData.message || "Clock In Failed");
        }
      } else {
        // Clock Out
        const response = await fetch(`${API_BASE_URL}/employee/dashboard/clock-out`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (response.ok) {
          await response.json();
          localStorage.removeItem("attendance_status");
          localStorage.removeItem("attendance_start_time");
          setIsCheckedIn(false);
          showSuccess("Clocked Out Successfully!");
        } else {
          const errorData = await response.json();
          showError(errorData.message || "Clock Out Failed");
        }
      }
    } catch (error) {
      console.error("Clock Action Error:", error);
      showError("Failed to update attendance. Please try again.");
    } finally {
      setIsClockingIn(false);
    }
  };
  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: 'include'
      });
      if (res.ok) {
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  // -----------------------------------

  // Auto-close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileOpen]);

  const isExpandedVisual = mobileOpen ? true : expanded;

  return (
    <>
      {/* --- Mobile Trigger Button (Fixed) --- */}


      {/* --- Mobile Overlay --- */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden pointer-events-auto"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* --- Main Sidebar --- */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50
          transition-all duration-300 ease-in-out flex flex-col
          ${isExpandedVisual ? "w-72" : "w-20"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* 1. Header & Logo */}
        <div className="h-20 flex items-center px-4 relative">
          <div className="flex items-center gap-3 overflow-hidden w-full">
            <img
              src={isExpandedVisual ? logo : mobileLogo}
              alt="Logo"
              className={`object-contain transition-all duration-300 ${isExpandedVisual ? "w-full h-10" : "w-8 h-8 mx-auto"
                }`}
            />
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="hidden lg:flex absolute -right-3 top-8 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-green-500 transition-all shadow-xl z-50 cursor-pointer"
          >
            {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* 2. Navigation Items */}
        <nav className="flex-1 flex flex-col gap-2 px-3 py-6 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map((item) => (
            <TooltipWrapper
              key={item.to}
              label={item.label}
              expanded={isExpandedVisual}
            >
              <NavLink
                to={item.to}
                end={item.to === "/user"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  group relative flex items-center p-3 rounded-xl transition-all duration-300 ease-in-out hover:scale-105 hover:ml-2 hover:font-bold
                  ${isActive
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-transparent"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                  }
                  ${isExpandedVisual ? "" : "justify-center"}
                `}
              >
                <div className="transition-transform duration-300 group-hover:scale-110">
                  {item.icon}
                </div>
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isExpandedVisual
                    ? "w-40 ml-3 opacity-100"
                    : "w-0 opacity-0 hidden"
                    }`}
                >
                  {item.label}
                </span>
              </NavLink>
            </TooltipWrapper>
          ))}
        </nav>

        {/* 3. Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col gap-2 mb-4">
            {/* --- FUNCTIONAL CHECK IN BUTTON --- */}
            <TooltipWrapper
              label={isCheckedIn ? "Clock Out" : "Check In"}
              expanded={isExpandedVisual}
            >
              <button
                disabled={isClockingIn}
                onClick={handleClockAction}
                className={`
                w-full flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden cursor-pointer
                ${isCheckedIn
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" // Red when clocked in
                    : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" // Green when clocked out
                  }
                ${isExpandedVisual ? "px-4 py-3" : "p-3 justify-center"}
                disabled:opacity-70 disabled:cursor-not-allowed
              `}
              >
                {isCheckedIn ? (
                  <Timer size={20} className="relative z-10 animate-pulse" />
                ) : (
                  <LogIn size={20} className="relative z-10" />
                )}

                <span
                  className={`font-bold whitespace-nowrap ml-3 transition-all duration-300 relative z-10 ${isExpandedVisual
                    ? "w-auto opacity-100 font-bold"
                    : "w-0 opacity-0 hidden"
                    }`}
                >
                  {isCheckedIn ? "Clock Out" : "Check In"}
                  {isClockingIn && <span className="ml-2 w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin inline-block"></span>}
                </span>

                {!isExpandedVisual && (
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${isCheckedIn ? "bg-red-500/10" : "bg-green-500/10"
                      }`}
                  />
                )}
              </button>
            </TooltipWrapper>

            {/* Logout Button */}
            <TooltipWrapper label="Logout" expanded={isExpandedVisual}>
              <button
                onClick={handleLogout}
                className={`
                w-full flex items-center rounded-xl transition-all duration-300 group cursor-pointer
                ${isExpandedVisual
                    ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 px-4 py-3"
                    : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-3 justify-center"
                  }
              `}
              >
                <LogOut size={20} />
                <span
                  className={` whitespace-nowrap ml-3 transition-all duration-300 font-bold ${isExpandedVisual
                    ? "w-auto opacity-100"
                    : "w-0 opacity-0 hidden"
                    }`}
                >
                  Logout
                </span>
              </button>
            </TooltipWrapper>
          </div>


          {/* User Profile */}
          <div
            onClick={() => {
              navigate('/user/settings');
              setMobileOpen(false);
              window.location.reload();
            }}
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpandedVisual ? "" : "justify-center"
              }`}
          >
            <div className="relative">
              <Avatar className="w-9 h-9 border border-slate-200 dark:border-slate-600">
                <AvatarImage src={user.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full z-10"></span>
            </div>
            <div
              className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpandedVisual ? "w-32 ml-1" : "w-0 opacity-0 hidden"
                }`}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500 truncate">
                {user.role}
              </span>
            </div>
            {isExpandedVisual && (
              <div onClick={(e) => e.stopPropagation()}>
                <ThemeToggleBtn />
              </div>
            )}
          </div>

          {/* Collapsed Theme Toggle */}
          {!isExpandedVisual && (
            <div className="mt-2 flex justify-center">
              <TooltipWrapper label="Switch Theme" expanded={isExpandedVisual}>
                <ThemeToggleBtn />
              </TooltipWrapper>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// --- Theme Toggle Component ---
const ThemeToggleBtn = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-all duration-300 hover:bg-slate-800 text-slate-400 hover:text-yellow-400"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

// --- Reusable Tooltip Wrapper Component ---
interface TooltipWrapperProps {
  children: React.ReactNode;
  label: string;
  expanded: boolean;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({
  children,
  label,
  expanded,
}) => {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!expanded && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.top + rect.height / 2, // Center vertically
        left: rect.right + 10, // 10px to the right of the item
      });
      setHovered(true);
    }
  };

  const handleMouseLeave = () => setHovered(false);

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full"
      >
        {children}
      </div>

      {/* PORTAL TOOLTIP */}
      {!expanded &&
        hovered &&
        createPortal(
          <div
            style={{
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
            }}
            className="fixed z-[9999] px-3 py-1.5 text-xs font-bold text-green-400 bg-slate-900 border border-slate-700 rounded-md shadow-xl -translate-y-1/2 pointer-events-none animate-in fade-in duration-200 whitespace-nowrap"
          >
            {label}
            {/* Small Arrow pointing left */}
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-slate-700 rotate-45"></div>
          </div>,
          document.body
        )}
    </>
  );
};

export default UserSidebar;
