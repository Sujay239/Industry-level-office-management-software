import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users,
    FileText,
    Wallet,
    TrendingUp,
    Megaphone,
    Play,
    // Search,
    Bell,
    MoreVertical,
    Calendar,
    Clock,
    // CheckCircle2,
    XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "../../components/NotificationProvider";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
    total_employees: number;
    employee_growth: string;
    payroll_cost: number;
    attendance_percentage: number;
    attendance_change: number;
    payroll_history: {
        month: string;
        full_month: string;
        amount: number;
    }[];
    pending_leaves: {
        id: number;
        type: string;
        start_date: string;
        end_date: string;
        reason: string;
        name: string;
        designation: string;
        avatar_url: string;
    }[];
    upcoming_holidays: {
        id: number;
        name: string;
        date: string;
        day: string;
        type: string;
    }[];
}

const AdminDashboard: React.FC = () => {
    // --- Announcement State ---
    const [isAnnouncementOpen, setIsAnnouncementOpen] = React.useState(false);
    const [announcementData, setAnnouncementData] = React.useState({ subject: "", message: "", priority: "Normal" });
    const [isSending, setIsSending] = React.useState(false);

    // --- Dashboard Data State ---
    const [stats, setStats] = React.useState<DashboardStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = React.useState(true);

    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    React.useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to load dashboard data');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error(error);
            showError('Failed to load dashboard statistics');
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleSendAnnouncement = async () => {
        if (!announcementData.subject || !announcementData.message) {
            showError("Subject and Message are required.");
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/announcements/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(announcementData),
            });

            const result = await response.json();

            if (!response.ok) {
                // Check for 2FA requirement (403 usually means forbidden, check message)
                if (response.status === 403 && result.message === '2FA verification required') {
                    showError("2FA Verification Required. Please verify 2FA.");
                    window.location.href = '/verify-2fa';
                    return;
                }
                throw new Error(result.message || "Failed to send announcement");
            }

            showSuccess(`Announcement sent! (${result.stats.sent} sent, ${result.stats.failed} failed)`);
            setIsAnnouncementOpen(false);
            setAnnouncementData({ subject: "", message: "", priority: "Normal" });

        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to send announcement");
        } finally {
            setIsSending(false);
        }
    };

    // --- Notification State ---
    const [isNotificationModalOpen, setIsNotificationModalOpen] = React.useState(false);
    const [notificationData, setNotificationData] = React.useState({ title: "", message: "", type: "info", send_to_all: false, user_ids: [] as number[] });
    const [users, setUsers] = React.useState<{ id: number; name: string }[]>([]);

    // Fetch users for notification selection
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users || []); // Assuming /admin/emp/all returns { users: [...] }
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    React.useEffect(() => {
        if (isNotificationModalOpen && users.length === 0) {
            fetchUsers();
        }
    }, [isNotificationModalOpen]);

    const handleSendNotification = async () => {
        if (!notificationData.title || !notificationData.message) {
            showError("Title and Message are required.");
            return;
        }
        if (!notificationData.send_to_all && notificationData.user_ids.length === 0) {
            showError("Please select at least one user or choose 'Send to All'.");
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(notificationData),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Failed to send notification");

            showSuccess(`Notification sent to ${result.count} users!`);
            setIsNotificationModalOpen(false);
            setNotificationData({ title: "", message: "", type: "info", send_to_all: false, user_ids: [] });

        } catch (error: any) {
            showError(error.message);
        } finally {
            setIsSending(false);
        }
    };

    // Calculate Chart Data
    const chartData = React.useMemo(() => {
        if (!stats?.payroll_history || stats.payroll_history.length === 0) return [];
        const maxAmount = Math.max(...stats.payroll_history.map(h => h.amount));
        return stats.payroll_history.map(h => ({
            m: h.month,
            h: maxAmount > 0 ? `${(h.amount / maxAmount) * 100}%` : '0%',
            v: `₹${h.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        }));
    }, [stats]);




    // ... inside component ...

    // REMOVED BLOCKING LOADER
    // if (isLoadingStats) { ... }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* --- Header with Search --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Welcome back, Admin. Here's what's happening today.
                        </p>
                    </div>
                </div>

                {/* --- Top Metrics Grid (3 Columns now) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Employees */}
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Staff</span>
                            <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoadingStats ? (
                                <Skeleton className="h-9 w-24 mb-1" />
                            ) : (
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats?.total_employees || 0}</h2>
                            )}
                            <div className="flex items-center mt-1 text-xs">
                                {isLoadingStats ? (
                                    <Skeleton className="h-4 w-32" />
                                ) : (
                                    <>
                                        <span className="text-green-600 dark:text-green-400 flex items-center font-medium">
                                            <TrendingUp className="h-3 w-3 mr-1" /> {stats?.employee_growth}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-500 ml-2">from last month</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Payroll */}
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Payroll Cost</span>
                            <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoadingStats ? (
                                <Skeleton className="h-9 w-32 mb-1" />
                            ) : (
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">₹{(stats?.payroll_cost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                            )}
                            <div className="flex items-center mt-1 text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Next run: </span>
                                <span className="text-slate-900 dark:text-white font-medium ml-1">End of Month</span>
                            </div>
                        </div>
                    </Card>

                    {/* Attendance */}
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Attendance</span>
                            <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoadingStats ? (
                                <Skeleton className="h-9 w-16 mb-1" />
                            ) : (
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats?.attendance_percentage || 0}%</h2>
                            )}
                            <div className="flex items-center mt-1 text-xs">
                                {isLoadingStats ? (
                                    <Skeleton className="h-4 w-24" />
                                ) : (
                                    <>
                                        <span className={`${(stats?.attendance_change || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"} flex items-center font-medium`}>
                                            <TrendingUp className={`h-3 w-3 mr-1 ${(stats?.attendance_change || 0) < 0 ? "rotate-180" : ""}`} /> {Math.abs(stats?.attendance_change || 0)}%
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-500 ml-2">vs yesterday</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Charts & Lists) - Spans 2 columns */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Payroll History Chart (Real Data) */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Payroll Expenses (6 Months)</CardTitle>
                                <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 0 ? (
                                    <div className="h-64 flex items-end justify-between gap-4 mt-4 px-2">
                                        {chartData.map((bar, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 w-full group cursor-pointer">
                                                <div className="text-xs font-bold text-slate-700 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity mb-1">{bar.v}</div>
                                                <div
                                                    className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md relative overflow-hidden"
                                                    style={{ height: '200px' }}
                                                >
                                                    <div
                                                        className={`absolute bottom-0 w-full rounded-t-md transition-all duration-500 ${i === chartData.length - 1 ? 'bg-slate-900 dark:bg-slate-100' : 'bg-blue-500/80 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500'}`}
                                                        style={{ height: bar.h }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{bar.m}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                                        No payroll history available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 2. Leave Requests Table (Real Data) */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-amber-500" /> Pending Leave Requests
                                        {(stats?.pending_leaves.length || 0) > 0 && (
                                            <Badge variant="secondary" className="ml-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{stats?.pending_leaves.length} New</Badge>
                                        )}
                                    </CardTitle>
                                    <Button variant="link" onClick={() => navigate('/admin/leaves')} className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer">View All</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {!stats?.pending_leaves.length ? (
                                        <div className="text-center text-slate-500 py-4 text-sm">No pending leave requests</div>
                                    ) : (
                                        stats.pending_leaves.map((req, i) => (
                                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                                        <AvatarImage src={req.avatar_url || `https://i.pravatar.cc/150?u=${req.name}`} />
                                                        <AvatarFallback className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800">{req.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{req.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{req.designation} • <span className="text-amber-600 dark:text-amber-500 font-medium">{req.type}</span></p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                                                    <div className="text-right mr-4">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200 text-nowrap">
                                                            {new Date(req.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(req.end_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Right Column (Widgets) */}
                    <div className="space-y-4">

                        {/* 1. Upcoming Holidays (Real Data) */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-orange-500 dark:text-white" /> Upcoming Holidays
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!stats?.upcoming_holidays.length ? (
                                    <div className="text-center text-slate-500 py-4 text-sm">No upcoming holidays</div>
                                ) : (
                                    stats.upcoming_holidays.map((holiday, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{holiday.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{holiday.type}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500">{holiday.day}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-8 text-slate-500 dark:text-slate-400 border-dashed dark:border-slate-800 cursor-pointer"
                                    onClick={() => navigate('/admin/holidays')}
                                >
                                    View Full Calendar
                                </Button>
                            </CardContent>
                        </Card>


                        {/* 3. Quick Actions (Condensed) */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 py-2 h-[50%] max-sm:mb-[52px]">
                            <CardHeader className="pb-2 flex items-center mt-4 ">
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Shortcuts</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col gap-2 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-pointer"
                                    onClick={() => setIsAnnouncementOpen(true)}
                                >
                                    <Megaphone className="h-5 w-5 text-blue-500" />
                                    <span className="text-xs">Announcement</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-pointer">
                                    <Play className="h-5 w-5 text-green-500" />
                                    <span className="text-xs">Run Payroll</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col gap-2 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-pointer"
                                    onClick={() => setIsNotificationModalOpen(true)}
                                >
                                    <Bell className="h-5 w-5 text-purple-500" />
                                    <span className="text-xs">Send Notif.</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => navigate('/admin/holidays')}>
                                    <Calendar className="h-5 w-5 text-orange-500 dark:text-white" />
                                    <span className="text-xs">Holidays</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>

            {/* --- Announcement Modal --- */}
            {isAnnouncementOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Megaphone className="h-5 w-5 text-blue-500" /> New Announcement
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setIsAnnouncementOpen(false)}>
                                    <XCircle className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                                <Input
                                    placeholder="e.g. Office Closed on Friday"
                                    value={announcementData.subject}
                                    onChange={(e) => setAnnouncementData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority level</label>
                                <div className="flex gap-2">
                                    {['Normal', 'Medium', 'High'].map(level => (
                                        <div
                                            key={level}
                                            onClick={() => setAnnouncementData(prev => ({ ...prev, priority: level }))}
                                            className={`
                                                cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium border transition-all
                                                ${announcementData.priority === level
                                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'}
                                            `}
                                        >
                                            {level}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message Content</label>
                                <textarea
                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 min-h-[150px]"
                                    placeholder="Write your announcement here..."
                                    value={announcementData.message}
                                    onChange={(e) => setAnnouncementData(prev => ({ ...prev, message: e.target.value }))}
                                ></textarea>
                                <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                    This will be emailed to all active employees.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAnnouncementOpen(false)}
                                    className="flex-1 cursor-pointer dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSendAnnouncement} disabled={isSending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                                    {isSending ? "Sending..." : "Post Announcement"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* --- Notification Modal --- */}
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">
                        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-purple-500" /> Send Notification
                                </CardTitle>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => setIsNotificationModalOpen(false)}>
                                    <XCircle className="h-5 w-5 text-slate-500" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                                <Input
                                    placeholder="e.g. System Maintenance"
                                    value={notificationData.title}
                                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                                <div className="flex gap-2">
                                    {['info', 'warning', 'success', 'error'].map(type => (
                                        <div
                                            key={type}
                                            onClick={() => setNotificationData(prev => ({ ...prev, type: type }))}
                                            className={`
                                                cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium border transition-all uppercase
                                                ${notificationData.type === type
                                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700'}
                                            `}
                                        >
                                            {type}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                                <textarea
                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 min-h-[100px]"
                                    placeholder="Notification content..."
                                    value={notificationData.message}
                                    onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recipients</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="send_all"
                                        checked={notificationData.send_to_all}
                                        onChange={(e) => setNotificationData(prev => ({ ...prev, send_to_all: e.target.checked }))}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <label htmlFor="send_all" className="text-sm text-slate-700 dark:text-slate-300">Send to All Employees</label>
                                </div>
                                {!notificationData.send_to_all && (
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md p-2 space-y-1">
                                        {users.map(user => (
                                            <div key={user.id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`user_${user.id}`}
                                                    checked={notificationData.user_ids.includes(user.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setNotificationData(prev => ({
                                                            ...prev,
                                                            user_ids: checked
                                                                ? [...prev.user_ids, user.id]
                                                                : prev.user_ids.filter(id => id !== user.id)
                                                        }));
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                                                />
                                                <label htmlFor={`user_${user.id}`} className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none truncate">
                                                    {user.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsNotificationModalOpen(false)}
                                    className="flex-1 cursor-pointer dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSendNotification} disabled={isSending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
                                    {isSending ? "Sending..." : "Send Notification"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
};

export default AdminDashboard;
