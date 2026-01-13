import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Wallet,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    Sun,
    Moon,
    // Shield,
    CalendarCheck,
    Calendar,
    Clock,
    CheckSquare,
    MessageSquare
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useUser } from "./UserProvider"; // We can reuse UserProvider for now

// --- Configuration ---
const logo = "/logo.png";
const mobileLogo = "/mobile-logo.png";

type NavItem = {
    label: string;
    to: string;
    icon: React.ReactNode;
};

const navItems: NavItem[] = [
    { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Tasks", to: "/admin/tasks", icon: <CheckSquare size={20} /> },
    { label: "Employees", to: "/admin/employees", icon: <Users size={20} /> },
    { label: "Attendance", to: "/admin/attendance", icon: <CalendarCheck size={20} /> },
    { label: "Meetings", to: "/admin/meetings", icon: <CalendarCheck size={20} /> },
    { label: "Holidays", to: "/admin/holidays", icon: <Calendar size={20} /> },
    { label: "Chats", to: "/admin/chats", icon: <MessageSquare size={20} /> },
    { label: "Payroll", to: "/admin/payroll", icon: <Wallet size={20} /> },
    { label: "Leaves", to: "/admin/leaves", icon: <FileText size={20} /> },
    { label: "Settings", to: "/admin/settings", icon: <Settings size={20} /> },
    { label: "Past Employees", to: "/admin/past-employees", icon: <Clock size={20} /> },
];

interface AdminSidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;
    const { user: contextUser } = useUser();
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(true);

    // Auto-close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);

        // Fetch logged in user data
        const fetchMyData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/myData`, {
                    credentials: "include"
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data.user);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            }
        };
        fetchMyData();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setExpanded((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                navigate("/login");
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const isExpandedVisual = mobileOpen || expanded;

    return (
        <>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[90] lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}



            {/* --- Sidebar Container --- */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-[100]
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          transition-all duration-300 ease-in-out
          flex flex-col
          ${mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
          ${expanded ? "lg:w-64" : "lg:w-20"}
        `}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${expanded ? 'w-full' : 'absolute left-0 w-full justify-center lg:justify-center'}`}>
                        <img
                            src={expanded ? logo : mobileLogo}
                            alt="Logo"
                            className={`transition-all duration-300 ${expanded ? 'h-8' : 'h-8 lg:h-10 lg:w-10 object-contain'}`}
                        />
                    </div>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors absolute -right-3 top-9 border border-slate-200 dark:border-slate-700 shadow-sm z-50"
                    >
                        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                    {navItems.map((item) => (
                        <TooltipWrapper key={item.to} text={item.label} expanded={expanded}>
                            <NavLink
                                to={item.to}
                                end={item.to === "/admin"} // Only exact match for dashboard home
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive
                                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                    }
                    ${!isExpandedVisual ? "justify-center" : ""}
                  `}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {item.icon}
                                </span>
                                <span
                                    className={`
                      whitespace-nowrap font-medium transition-all duration-300 relative z-10
                      ${isExpandedVisual ? "w-auto opacity-100 ml-1" : "w-0 opacity-0 hidden"}
                    `}
                                >
                                    {item.label}
                                </span>
                            </NavLink>
                        </TooltipWrapper>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">

                    <div className="flex items-center  justify-between gap-2">

                        {/* Logout Button */}
                        <TooltipWrapper text="Logout" expanded={expanded}>
                            <button
                                onClick={handleLogout}
                                className={`
                flex items-center rounded-xl transition-all duration-200 w-full group cursor-pointer
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
                        className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpandedVisual ? "" : "justify-center"
                            }`} onClick={() => {
                                navigate("/admin/settings")
                                setMobileOpen(false);
                            }
                            }
                    >
                        <div className="relative" >
                            <img
                                src={userData?.avatar_url
                                    ? `${API_BASE_URL}/uploads/${userData.avatar_url}`
                                    : (contextUser.avatar || "https://ui-avatars.com/api/?name=Admin")}
                                className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 object-cover"
                                alt="User"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-950 rounded-full"></span>
                        </div>
                        <div
                            className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpandedVisual ? "w-32 ml-1" : "w-0 opacity-0 hidden"
                                }`}
                        >
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {userData ? userData.name : "Admin User"}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                {userData?.designation || "Administrator"}
                            </span>
                        </div>
                        {isExpandedVisual && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <ThemeToggleBtn />
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

// --- Theme Toggle Button ---
const ThemeToggleBtn = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
};

// --- Helper for Tooltips ---
const TooltipWrapper = ({ children, text, expanded }: { children: React.ReactNode; text: string; expanded: boolean }) => {
    const [show, setShow] = useState(false);

    // Portal ref to render tooltip outside overflow-hidden containers
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const childRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (!expanded && childRef.current) {
            const rect = childRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2, // Center vertically
                left: rect.right + 10 // Offset to right
            });
            setShow(true);
        }
    };

    return (
        <div
            ref={childRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShow(false)}
            className="relative w-full"
        >
            {children}
            {/* Render tooltip in portal when sidebar is collapsed (expanded=false) */}
            {!expanded && show && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-200 pointer-events-none whitespace-nowrap"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-50%)'
                    }}
                >
                    {text}
                    {/* Tiny arrow pointing left */}
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-900 transform -translate-y-1/2 rotate-45" />
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminSidebar;

