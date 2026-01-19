import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CalendarCheck,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, addDays, isToday, isFuture } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// import axios from "axios";
import { useNotification } from "../../components/NotificationProvider";
import * as XLSX from "xlsx";

interface AttendanceRecord {
  id: number;
  attendanceId?: number;
  name: string;
  avatar: string | null;
  designation: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: string;
}

const AdminAttendance: React.FC = () => {
  const { showError } = useNotification();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [holidayName, setHolidayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // View Mode: 'daily' (default) or 'history'
  const [viewMode, setViewMode] = useState<"daily" | "history">("daily");

  // Daily View State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // History View State
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  const handlePrevDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, d MMMM yyyy");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("mode", viewMode);

      if (viewMode === "daily") {
        params.append("date", formattedDate);
      } else {
        params.append("month", selectedMonth);
        params.append("year", selectedYear);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/attendance?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for cookies (JWT)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch attendance data");
      }

      const data = await response.json();

      // Handle both array (legacy/history) and object (new daily format)
      if (Array.isArray(data)) {
        setAttendanceData(data);
        setHolidayName(null); // Reset for history view
      } else {
        setAttendanceData(data.attendanceData);
        if (data.holidayStatus?.isSunday) {
          setHolidayName("Sunday");
        } else if (data.holidayStatus?.isHoliday) {
          setHolidayName(data.holidayStatus.name || "Holiday");
        } else {
          setHolidayName(null);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      showError("Failed to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [viewMode, formattedDate, selectedMonth, selectedYear]);

  // Filter Logic
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredData = attendanceData.filter((record) => {
    if (filterStatus === "All") return true;
    return record.status === filterStatus;
  });

  // Calculate stats (Fix: use full data for stats, or filtered? Usually stats show overall, but list shows filtered. Let's keep stats on FULL data for context, or filter?
  // User generally wants to see "How many present?" globally, then filter list to see WHO.
  // Let's keep stats based on attendanceData (full).
  // Calculate stats based on FULL data
  const presentCount = attendanceData.filter((r) =>
    ["Present", "Late", "Half Day"].includes(r.status)
  ).length;

  const absentCount = attendanceData.filter(
    (r) => r.status === "Absent"
  ).length;

  const onLeaveCount = attendanceData.filter((r) =>
    ["On Leave", "Leave"].includes(r.status)
  ).length;

  const calculatedLate = attendanceData.filter((r) => {
    if (r.status === "Late") return true;
    if (["Present", "Half Day"].includes(r.status) && r.checkIn !== "-") {
      const [time, period] = r.checkIn.split(" ");
      const [h, m] = time.split(":").map(Number);

      // Late logic: After 9:15 AM
      if (period === "AM" && h === 9 && m > 15) return true;
      if (period === "AM" && h > 9 && h !== 12) return true;
      if (period === "PM" && h !== 12) return true; // Late if PM (unless 12 PM which is noon)
      // Note: 12 PM is noon. 12 AM is midnight.
      // If checkIn is 12:30 PM, that's late.
      // If checkIn is 12:00 PM, that's late.
      // So period === "PM" is generally late for a morning shift.
      if (period === "PM") return true;

      return false;
    }
    return false;
  }).length;

  const handleExport = () => {
    if (filteredData.length === 0) {
      showError("No data to export");
      return;
    }

    const dataToExport = filteredData.map((row) => ({
      "Employee Name": row.name,
      "Designation": row.designation,
      "Date": row.date,
      "Check In": row.checkIn,
      "Check Out": row.checkOut,
      "Working Hours": row.hours,
      "Status": row.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Adjust column width for better visibility
    const max_width = dataToExport.reduce((w, r) => Math.max(w, r["Employee Name"].length), 10);
    worksheet["!cols"] = [{ wch: max_width }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }];

    XLSX.writeFile(workbook, `attendance_report_${viewMode}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
              Attendance Monitoring
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
              Track daily employee check-ins and working hours.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <Label
                htmlFor="view-mode"
                className={`text-sm cursor-pointer transition-all ${viewMode === "daily"
                  ? "font-bold text-slate-900 dark:text-white underline decoration-2 underline-offset-4"
                  : "text-slate-500 dark:text-slate-500"
                  }`}
              >
                Daily
              </Label>
              <Switch
                id="view-mode"
                checked={viewMode === "history"}
                onCheckedChange={(checked) =>
                  setViewMode(checked ? "history" : "daily")
                }
              />
              <Label
                htmlFor="view-mode"
                className={`text-sm cursor-pointer transition-all ${viewMode === "history"
                  ? "font-bold text-slate-900 dark:text-white underline decoration-2 underline-offset-4"
                  : "text-slate-500 dark:text-slate-500"
                  }`}
              >
                History
              </Label>
            </div>

            <Button
              variant="outline"
              onClick={handleExport}
              className="dark:bg-slate-800 dark:text-white dark:border-slate-800 cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* --- Filters & Navigation --- */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4 transition-all">

          {/* Left Side: Navigation / Month Select */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            {viewMode === "daily" ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevDay}
                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-slate-500" />
                  <span className="font-semibold text-slate-900 dark:text-white text-lg max-sm:text-[14px]">
                    {isToday(selectedDate) ? "Today" : displayDate}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                  disabled={
                    isToday(selectedDate) || isFuture(addDays(selectedDate, 1))
                  }
                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-30 dark:bg-slate-800 dark:text-white dark:border-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-white whitespace-nowrap">
                  Period:
                </span>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[130px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white h-9">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {format(new Date(2000, m - 1, 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white h-9">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right Side: Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full">
              <Filter className="h-4 w-4 text-slate-500 dark:text-white shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-white whitespace-nowrap">
                Filter:
              </span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[150px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Present">Present</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="Late">Late</SelectItem>
                  <SelectItem value="Half Day">Half Day</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* --- Stats Row --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            onClick={() => setFilterStatus("Present")}
            className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${filterStatus === 'Present' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
          >
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              {" "}
              <CheckCircle2 size={24} />{" "}
            </div>
            <div>
              {" "}
              <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                {presentCount}
              </p>{" "}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === "daily" ? "Present Today" : "Total Present"}
              </p>{" "}
            </div>
          </Card>
          <Card
            onClick={() => setFilterStatus("Absent")}
            className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${filterStatus === 'Absent' ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
          >
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              {" "}
              <XCircle size={24} />{" "}
            </div>
            <div>
              {" "}
              <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                {absentCount}
              </p>{" "}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === "daily"
                  ? "Absent Today"
                  : "Total Absent (Logged)"}
              </p>{" "}
            </div>
          </Card>
          <Card
            onClick={() => setFilterStatus("Late")}
            className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${filterStatus === 'Late' ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
          >
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              {" "}
              <Clock size={24} />{" "}
            </div>
            <div>
              {" "}
              <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                {calculatedLate}
              </p>{" "}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Late Arrivals
              </p>{" "}
            </div>
          </Card>
          <Card
            onClick={() => setFilterStatus("On Leave")}
            className={`p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 cursor-pointer transition-colors ${filterStatus === 'On Leave' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
          >
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              {" "}
              <CalendarCheck size={24} />{" "}
            </div>
            <div>
              {" "}
              <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                {onLeaveCount}
              </p>{" "}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                On Leave
              </p>{" "}
            </div>
          </Card>
        </div>

        {/* --- Desktop View: Table --- */}
        <Card className="hidden md:block border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center text-slate-500">
                Loading attendance data...
              </div>
            ) : holidayName ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
                <div className="p-4 bg-amber-100 dark:bg-amber-900/20 rounded-full mb-4">
                  <CalendarCheck className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {holidayName} - No Attendance Today
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  Attendance tracking is paused for{" "}
                  {holidayName === "Sunday" ? "Sundays" : "official holidays"}.
                  Enjoy your day off!
                </p>
              </div>
            ) : filteredData.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Check In</th>
                    <th className="px-6 py-4 font-medium">Check Out</th>
                    <th className="px-6 py-4 font-medium">Working Hours</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((record, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          {record.avatar ? (
                            <img
                              src={record.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                              {record.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{record.name}</p>
                            {record.designation && (
                              <p className="text-xs text-slate-500">
                                {record.designation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {record.checkIn}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {record.checkOut}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                        {record.hours}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          variant="outline"
                          className={`
                                            ${record.status === "Present"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : ""
                            }
                                            ${record.status === "Absent"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : ""
                            }
                                            ${record.status === "Late"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : ""
                            }
                                            ${record.status === "Half Day" ||
                              record.status === "On Leave"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ""
                            }
                                        `}
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                <p>No attendance records found.</p>
              </div>
            )}
          </div>
        </Card>

        {/* --- Mobile View: Cards --- */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading...</div>
          ) : holidayName ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full mb-3">
                <CalendarCheck className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {holidayName}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No Attendance Today
              </p>
            </div>
          ) : filteredData.length > 0 ? (
            filteredData.map((record, index) => (
              <Card
                key={index}
                className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-white">
                      {record.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {record.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <CalendarCheck className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {record.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`
                                        ${record.status === "Present"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : ""
                      }
                                        ${record.status === "Absent"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : ""
                      }
                                        ${record.status === "Late"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : ""
                      }
                                        ${record.status === "Half Day"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : ""
                      }
                                    `}
                  >
                    {record.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Check In
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                      {record.checkIn}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Check Out
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                      {record.checkOut}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Total Hours
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {record.hours}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <p>No attendance records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
