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
    Shield,
    CalendarCheck,
    Calendar,
    Clock,
    CheckSquare,
    MessageSquare
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useUser } from "./UserProvider";

// --- Configuration ---
const logo = "/logo.png";
const mobileLogo = "/mobile-logo.png";

type NavItem = {
    label: string;
    to: string;
    icon: React.ReactNode;
};

const navItems: NavItem[] = [
    { label: "Dashboard", to: "/super-admin", icon: <LayoutDashboard size={20} /> },
    { label: "Tasks", to: "/super-admin/tasks", icon: <CheckSquare size={20} /> },
    { label: "Employees", to: "/super-admin/employees", icon: <Users size={20} /> },
    { label: "Attendance", to: "/super-admin/attendance", icon: <CalendarCheck size={20} /> },
    { label: "Meetings", to: "/super-admin/meetings", icon: <CalendarCheck size={20} /> },
    { label: "Holidays", to: "/super-admin/holidays", icon: <Calendar size={20} /> },
    { label: "Chats", to: "/super-admin/chats", icon: <MessageSquare size={20} /> },
    { label: "Payroll", to: "/super-admin/payroll", icon: <Wallet size={20} /> },
    { label: "Leaves", to: "/super-admin/leaves", icon: <FileText size={20} /> },
    { label: "Admins", to: "/super-admin/manage-admins", icon: <Shield size={20} /> }, // Exclusive to Super Admin
    { label: "Departments", to: "/super-admin/departments", icon: <Users size={20} /> }, // New
    { label: "Settings", to: "/super-admin/settings", icon: <Settings size={20} /> },
    { label: "Past Employees", to: "/super-admin/past-employees", icon: <Clock size={20} /> },
    { label: "Audit Logs", to: "/super-admin/audit-logs", icon: <Calendar size={20} /> },
];

interface SuperAdminSidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
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
          bg-slate-900 dark:bg-black  border-r border-slate-800 dark:border-slate-800
          transition-all duration-300 ease-in-out
          flex flex-col text-white
          ${mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
          ${expanded ? "lg:w-64" : "lg:w-20"}
        `}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 dark:border-white/10">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${expanded ? 'w-full' : 'absolute left-0 w-full justify-center lg:justify-center'}`}>
                        <img
                            src={expanded ? logo : mobileLogo}
                            alt="Logo"
                            className={`transition-all duration-300 ${expanded ? 'h-8 ' : 'h-8 lg:h-10 lg:w-10 object-contain brightness-0 invert'}`}
                        />
                    </div>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-900 text-slate-400 hover:text-white transition-colors absolute -right-3 top-9 border border-slate-700 dark:border-slate-800 shadow-sm z-50"
                    >
                        {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent">
                    {navItems.map((item) => (
                        <TooltipWrapper key={item.to} text={item.label} expanded={expanded}>
                            <NavLink
                                to={item.to}
                                end={item.to === "/super-admin"} // Only exact match for dashboard home
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
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

                {/* User Profile & Actions Footer */}
                <div className="p-4 border-t border-white/10 dark:border-white/10 bg-white/5 dark:bg-white/5 space-y-4">

                    <div className="flex items-center  justify-between gap-2">

                        {/* Logout Button */}
                        <TooltipWrapper text="Logout" expanded={expanded}>
                            <button
                                onClick={handleLogout}
                                className={`
                flex items-center rounded-xl transition-all duration-200 w-full group cursor-pointer
                ${isExpandedVisual
                                        ? "bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 px-4 py-3 border border-white/5"
                                        : "bg-transparent hover:bg-white/5 text-slate-400 hover:text-red-400 p-3 justify-center"
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
                        className={`flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${isExpandedVisual ? "" : "justify-center"
                            }`} onClick={() => {
                                navigate("/super-admin/settings");
                                setMobileOpen(false);
                            }
                            }
                    >
                        <div className="relative" >
                            <img
                                src={userData?.avatar_url
                                    ? `${API_BASE_URL}/uploads/${userData.avatar_url}`
                                    : (contextUser.avatar || "https://ui-avatars.com/api/?name=Super+Admin")}
                                className="w-9 h-9 rounded-full border border-slate-600 bg-slate-800 object-cover"
                                alt="User"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-slate-900 rounded-full"></span>
                        </div>
                        <div
                            className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpandedVisual ? "w-32 ml-1" : "w-0 opacity-0 hidden"
                                }`}
                        >
                            <span className="text-sm font-semibold text-white truncate">
                                {userData ? userData.name : "Super Admin"}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                                {userData?.designation || "System Owner"}
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
            className="p-2 rounded-lg bg-white/10 text-slate-400 hover:bg-white/20 transition-colors"
        >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
};

// --- Helper for Tooltips ---
const TooltipWrapper = ({ children, text, expanded }: { children: React.ReactNode; text: string; expanded: boolean }) => {
    const [show, setShow] = useState(false);
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
            {!expanded && show && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-200 pointer-events-none whitespace-nowrap border border-slate-700"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform: 'translateY(-50%)'
                    }}
                >
                    {text}
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 transform -translate-y-1/2 rotate-45" />
                </div>,
                document.body
            )}
        </div>
    );
};

export default SuperAdminSidebar;
