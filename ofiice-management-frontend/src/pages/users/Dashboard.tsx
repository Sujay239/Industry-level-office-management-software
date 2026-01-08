import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Briefcase,
  Play,
  Square,
  Calendar,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useNotification } from "@/components/NotificationProvider";
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Utility to format seconds into HH:MM:SS
 */
const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  attendancePercentage: number;
  daysPresent: number;
}

interface ScheduleItem {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  join_url: string;
  type: string;
}

interface ActivityItem {
  title: string;
  description: string;
  created_at: string;
  type: 'task' | 'meeting';
}

const UserHome: React.FC = () => {
  // --- Attendance State ---
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isClockingIn, setIsClockingIn] = useState(false);

  // --- Dashboard Data State ---
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();


  // --- Fetch Dashboard Data ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employee/dashboard/stats`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setStatsData(data.stats);
          setSchedule(data.schedule);
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);


  // --- SYNC LOGIC (The Fix) ---
  useEffect(() => {
    const checkStatus = () => {
      // Use the SAME keys as the Sidebar and Attendance page
      const storedStatus = localStorage.getItem("attendance_status");
      const storedStart = localStorage.getItem("attendance_start_time");

      if (storedStatus === "clocked_in" && storedStart) {
        setIsCheckedIn(true);
        setStartTime(parseInt(storedStart, 10));
      } else {
        setIsCheckedIn(false);
        setStartTime(null);
        setElapsedSeconds(0);
      }
    };

    // 1. Check immediately on load
    checkStatus();

    // 2. Listen for changes (e.g. if Sidebar button is clicked)
    window.addEventListener("storage", checkStatus);

    // 3. Poll every second to catch changes made in the same tab (Sidebar)
    const syncInterval = setInterval(checkStatus, 1000);

    return () => {
      window.removeEventListener("storage", checkStatus);
      clearInterval(syncInterval);
    };
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isCheckedIn && startTime) {
      // Update immediately
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));

      interval = setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isCheckedIn, startTime]);

  // --- Handlers ---
  const handleClockIn = async () => {
    if (isClockingIn) return;
    setIsClockingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employee/dashboard/clock-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        await response.json();
        const now = Date.now();

        setStartTime(now);
        setIsCheckedIn(true);

        // SAVE using the correct keys
        localStorage.setItem("attendance_start_time", now.toString());
        localStorage.setItem("attendance_status", "clocked_in");

        showSuccess("Clocked In Successfully!");
      } else {
        const errorData = await response.json();
        console.error("Clock In failed:", errorData.message);
        showError(errorData.message || "Clock In Failed");
      }
    } finally {
      setIsClockingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (isClockingIn) return;
    setIsClockingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employee/dashboard/clock-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        await response.json();
        setIsCheckedIn(false);
        setStartTime(null);
        setElapsedSeconds(0); // Reset timer visual

        // REMOVE using the correct keys
        localStorage.removeItem("attendance_start_time");
        localStorage.removeItem("attendance_status");

        showSuccess("Clocked Out Successfully!");
      } else {
        const errorData = await response.json();
        console.error("Clock Out failed:", errorData.message);
        showError(errorData.message || "Clock Out Failed");
      }
    } finally {
      setIsClockingIn(false);
    }
  };

  // --- Derived Stats for Display ---
  const stats = [
    {
      label: "Total Tasks",
      value: statsData?.totalTasks.toString() || "0",
      icon: <LayoutDashboard size={20} />,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400",
      trend: "All time",
    },
    {
      label: "Completed",
      value: statsData?.completedTasks.toString() || "0",
      icon: <CheckCircle2 size={20} />,
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      trend: "Finished tasks",
    },
    {
      label: "Pending",
      value: statsData?.pendingTasks.toString() || "0",
      icon: <Clock size={20} />,
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      textColor: "text-orange-600 dark:text-orange-400",
      trend: "To do",
    },
    {
      label: "Attendance",
      value: `${statsData?.attendancePercentage || 0}%`,
      icon: <Briefcase size={20} />,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-600 dark:text-purple-400",
      trend: `${statsData?.daysPresent || 0} days present`,
    },
  ];

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Convert to hours
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen font-sans">
      {/* Header Section */}
      {/* Header Section (Sticky) */}
      <div className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md -mx-6 px-6 py-4 pr-16 lg:pr-8 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 transition-all shadow-sm shadow-slate-200/50 dark:shadow-black/20">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Welcome back, here's your daily overview.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 max-md:w-full">
          <Badge
            variant="secondary"
            className="px-3 py-1 rounded-md text-slate-600 dark:text-slate-300 font-medium"
          >
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </Badge>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white px-2">
            {isCheckedIn ? "Online" : "Offline"}
          </span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
          ></span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Timer */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, idx) => (
              <Card
                key={idx}
                className="relative overflow-hidden hover:shadow-md transition-shadow group border-slate-100 dark:border-slate-700/60"
              >
                {/* Background Watermark Icon */}
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 pointer-events-none">
                  {React.cloneElement(stat.icon as React.ReactElement<any>, {
                    size: 80,
                    className: stat.textColor,
                  })}
                </div>

                <CardContent className="p-6">
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div
                      className={`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`}
                    >
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="relative z-10 text-3xl font-bold text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="relative z-10 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="relative z-10 text-xs text-slate-400 mt-3 font-medium flex items-center gap-1">
                    <ArrowUpRight size={12} /> {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Today's Schedule */}
          <Card className="border-slate-100 dark:border-slate-700/60 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 space-y-0">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Today's Schedule
              </CardTitle>
              <Button
                variant="ghost"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium h-auto p-0 hover:bg-transparent cursor-pointer"
              >
                View Calendar
              </Button>
            </CardHeader>

            {/* Empty State */}
            {schedule.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No meetings scheduled for today.</p>
              </div>
            )}

            {/* Mobile View: Card List using Shadcn Cards */}
            <div className="md:hidden space-y-4 p-4">
              {schedule.map((item, i) => {
                const isMeetingEnded = new Date(item.end_time) < new Date();
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0.5 text-[10px] h-auto"
                        >
                          {item.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {item.join_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isMeetingEnded}
                        className="h-8 text-xs bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => !isMeetingEnded && window.open(item.join_url, '_blank')}
                      >
                        {isMeetingEnded ? "Ended" : "Join"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block">
              {schedule.length > 0 && (
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-700/50">
                    <TableRow>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                        Event
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">
                        Time
                      </TableHead>
                      <TableHead className="px-6 py-4 font-semibold text-right text-slate-500 dark:text-slate-400">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedule.map((item, i) => {
                      const isMeetingEnded = new Date(item.end_time) < new Date();
                      return (
                        <TableRow
                          key={i}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.type}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />{" "}
                              {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {item.join_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isMeetingEnded}
                                className="h-8 text-xs bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => !isMeetingEnded && window.open(item.join_url, '_blank')}
                              >
                                {isMeetingEnded ? "Ended" : "Join"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Attendance Widget */}
        <div className="space-y-8">
          {/* Timer Card */}
          <Card className="rounded-3xl shadow-xl relative overflow-hidden bg-white dark:bg-transparent dark:bg-linear-to-br dark:from-slate-900 dark:to-slate-800 border-none">
            {/* Decorative background elements (Dark mode only) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-900/5 dark:bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>

            <div className="relative z-10 flex flex-col items-center text-center p-8">
              <Badge
                variant="outline"
                className={`mb-2 px-3 py-1 text-xs font-medium backdrop-blur-sm border-slate-200 dark:border-white/10 ${isCheckedIn
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white"
                  }`}
              >
                {isCheckedIn ? "Currently Working" : "Ready to Start?"}
              </Badge>

              <h2 className="text-5xl font-mono font-bold tracking-wider mb-2 tabular-nums text-slate-900 dark:text-white">
                {isCheckedIn ? formatTime(elapsedSeconds) : "00:00:00"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                {isCheckedIn
                  ? "Keep up the good work!"
                  : "Track your work hours automatically"}
              </p>

              <Button
                disabled={isClockingIn}
                onClick={isCheckedIn ? handleClockOut : handleClockIn}
                className={`
                      w-full py-6 rounded-xl font-bold text-lg shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed
                      ${isCheckedIn
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
                  }
                    `}
              >
                <span className="flex items-center justify-center gap-2">
                  {isCheckedIn ? (
                    <Square size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                  {isCheckedIn ? "Clock Out" : "Clock In"}
                  {isClockingIn && <span className="ml-2 w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>}
                </span>
              </Button>

              {startTime && isCheckedIn && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 w-full flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Started at</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {new Date(startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity Mini List */}
          <Card className="border-slate-200 dark:border-slate-700 p-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                >
                  <MoreVertical size={18} className="text-slate-400" />
                </Button>
              </div>

              {recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.map((act, i) => {
                    const icon = act.type === 'task' ? <CheckCircle2 size={16} /> : <Calendar size={16} />;
                    const color = act.type === 'task'
                      ? "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20"
                      : "text-purple-500 bg-purple-100 dark:bg-purple-500/20";

                    return (
                      <div key={i} className="flex gap-4">
                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                          {icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {act.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {act.description}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatActivityTime(act.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-slate-400 text-sm py-4">No recent activity.</div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserHome;
