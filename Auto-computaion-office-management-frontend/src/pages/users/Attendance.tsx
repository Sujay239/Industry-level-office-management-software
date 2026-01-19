import React, { useState, useEffect } from "react";
import { useAttendance } from "../../components/AttendanceProvider";
// import { useNotification } from "../../components/NotificationProvider";
import {
  CalendarDays,
  MapPin,
  History,
  CheckCircle2,
  XCircle,
  Timer,
  Download,
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
import ClockOutConfirmationDialog from "../../components/ClockOutConfirmationDialog";

// --- Types ---
type AttendanceStatus = "Present" | "Late" | "Absent" | "Half Day";

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: string;
  status: AttendanceStatus;
}

const Attendance = () => {
  // Helper to format ISO time to local 12h time
  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "--";
    }
  };

  // State for Clock In/Out status
  // --- Attendance Context ---
  const { isCheckedIn, hasCheckedOut, startTime, checkIn, checkOut } =
    useAttendance();
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalWorkingDays: 0,
    presentDays: 0,
    lateArrivals: 0,
    leavesTaken: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  // Real-time clock for the header
  const [currentTime, setCurrentTime] = useState(new Date());

  // const { showSuccess } = useNotification();

  const fetchAttendanceHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employee/attendance/history`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch attendance history", error);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    // Header clock
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // Duration timer (only runs if checked in)
    let timerInterval: ReturnType<typeof setInterval> | undefined;

    if (isCheckedIn && startTime) {
      timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - startTime;

        // Format milliseconds to HH:MM:SS
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }, 1000);
    } else {
      setElapsedTime("00:00:00");
    }

    return () => {
      clearInterval(clockInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isCheckedIn, startTime]);

  // --- HANDLERS ---
  // --- HANDLERS ---
  const handleClockAction = async () => {
    if (isClockingIn || hasCheckedOut) return;

    if (isCheckedIn) {
      setShowClockOutModal(true);
      return;
    }

    setIsClockingIn(true);
    try {
      await checkIn();
      await fetchAttendanceHistory();
    } finally {
      setIsClockingIn(false);
    }
  };

  // --- 3. CSV DOWNLOAD LOGIC ---
  const downloadReport = () => {
    // Define headers
    const headers = ["Date", "Check In", "Check Out", "Total Hours", "Status"];

    // Map data to rows
    const rows = history.map((record) => [
      record.date,
      formatTime(record.checkIn),
      formatTime(record.checkOut),
      record.totalHours,
      record.status,
    ]);

    // Create CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    // Create download link and click it
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for status colors
  const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
      case "Present":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "Late":
        return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "Absent":
        return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "Half Day":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default:
        return "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="space-y-8">
        {/* --- Header Section --- */}
        {/* --- Header Section (Sticky) --- */}
        <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="ml-0 mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 ml-2 max-sm:hidden">
              My Attendance
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm ">
              Check in/out and view your monthly records.
            </p>
          </div>
          <div className="text-right hidden sm:block mr-8">
            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {currentTime.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* --- Main Action Area (Split Grid) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Clock In/Out Widget (Takes up 1 column) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg bg-linear-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              {/* Visual Timer Circle */}
              <div
                className={`
                    w-40 h-40 rounded-full border-4 flex items-center justify-center mb-6 shadow-2xl transition-all duration-500 relative
                    ${isCheckedIn
                    ? "border-green-500 bg-green-500/10 shadow-green-500/20"
                    : "border-slate-500 bg-white/5 shadow-black/40"
                  }
                `}
              >
                <div className="text-center">
                  <span className="block text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">
                    {isCheckedIn ? "Duration" : "Clocked Out"}
                  </span>
                  <span className="block text-3xl font-bold font-mono tracking-tighter">
                    {isCheckedIn
                      ? elapsedTime
                      : currentTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                  </span>
                </div>
              </div>

              {/* Clock Button */}
              <div className="w-full max-w-xs space-y-4">
                <Button
                  disabled={isClockingIn || hasCheckedOut}
                  onClick={handleClockAction}
                  className={`
                            w-full h-12 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed
                            ${isCheckedIn
                      ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20 border-none"
                      : hasCheckedOut
                        ? "bg-slate-500 text-white cursor-not-allowed border-none"
                        : "bg-green-500 hover:bg-green-600 text-white shadow-green-900/20 border-none"
                    }
                        `}
                >
                  {isCheckedIn
                    ? "Clock Out"
                    : hasCheckedOut
                      ? "Done for Today"
                      : "Clock In"}
                  {isClockingIn && (
                    <span className="ml-2 w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin inline-block"></span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <MapPin size={14} />
                  <span>Location: Office HQ (Detected)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Stats Grid (Takes up 2 columns) */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Total Working Days"
              value={stats.totalWorkingDays.toString()}
              subtext="This Month"
              icon={<CalendarDays className="text-blue-500" />}
              bgClass="bg-blue-50 dark:bg-blue-900/10"
            />
            <StatsCard
              title="Present Days"
              value={stats.presentDays.toString()}
              subtext={`On Time: ${stats.presentDays - stats.lateArrivals}`}
              icon={<CheckCircle2 className="text-green-500" />}
              bgClass="bg-green-50 dark:bg-green-900/10"
            />
            <StatsCard
              title="Late Arrivals"
              value={stats.lateArrivals.toString()}
              subtext="-1hr penalty applied"
              icon={<Timer className="text-amber-500" />}
              bgClass="bg-amber-50 dark:bg-amber-900/10"
            />
            <StatsCard
              title="Leaves Taken"
              value={stats.leavesTaken.toString()}
              subtext=""
              icon={<XCircle className="text-red-500" />}
              bgClass="bg-red-50 dark:bg-red-900/10"
            />

            {/* Recent Activity */}
            <Card className="col-span-1 sm:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <History size={16} /> Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.slice(0, 2).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span className="text-slate-900 dark:text-slate-200">
                      {record.date === new Date().toISOString().split("T")[0]
                        ? "Today"
                        : new Date(record.date).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                        })}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatTime(record.checkIn)} -{" "}
                      {formatTime(record.checkOut)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- Attendance History List --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Attendance Log
            </h2>
            <Button
              onClick={downloadReport}
              variant="outline"
              size="sm"
              className="hidden sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Download size={16} className="mr-2" /> Download Report
            </Button>
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm bg-white dark:bg-slate-950">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                    Check In
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                    Check Out
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                    Working Hours
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow
                    key={record.id}
                    className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-medium text-slate-900 dark:text-slate-200">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                      {formatTime(record.checkIn)}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600 dark:text-slate-400">
                      {formatTime(record.checkOut)}
                    </TableCell>
                    <TableCell className="font-mono text-slate-900 dark:text-white font-medium">
                      {record.totalHours}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-medium border ${getStatusStyle(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View (Cards) */}
          <div className="md:hidden space-y-4">
            {/* Mobile Download Button */}
            <Button
              onClick={downloadReport}
              variant="outline"
              className="w-full flex sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-white mb-4"
            >
              <Download size={16} className="mr-2" /> Download CSV
            </Button>

            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <Badge
                    variant="outline"
                    className={`font-medium border ${getStatusStyle(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-400 text-xs mb-1">
                      Check In
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatTime(record.checkIn)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-400 text-xs mb-1">
                      Check Out
                    </span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatTime(record.checkOut)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-1">
                  <span>Total Hours</span>
                  <span className="font-mono">{record.totalHours}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Clock Out Confirmation Modal */}
      <ClockOutConfirmationDialog
        isOpen={showClockOutModal}
        onClose={() => setShowClockOutModal(false)}
        onConfirm={async () => {
          // const loading = isClockingIn;
          await checkOut();
          fetchAttendanceHistory(); // Refetch history if needed
          setShowClockOutModal(false);
        }}
      />
    </div>
  );
};

// --- Helper Component for Stats Cards ---
const StatsCard = ({
  title,
  value,
  subtext,
  icon,
  bgClass,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  bgClass: string;
}) => (
  <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {value}
          </div>
          <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgClass}`}>{icon}</div>
      </div>
    </CardContent>
  </Card>
);

export default Attendance;
