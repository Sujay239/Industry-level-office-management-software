import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarCheck, Download, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, addDays, isToday, isFuture } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// import axios from "axios";
import { useNotification } from "../../components/NotificationProvider";

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
    const { showSuccess, showError } = useNotification();
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // View Mode: 'daily' (default) or 'history'
    const [viewMode, setViewMode] = useState<'daily' | 'history'>('daily');

    // Daily View State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // History View State
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const displayDate = format(selectedDate, "EEEE, d MMMM yyyy");

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('mode', viewMode);

            if (viewMode === 'daily') {
                params.append('date', formattedDate);
            } else {
                params.append('month', selectedMonth);
                params.append('year', selectedYear);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/attendance?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies (JWT)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch attendance data');
            }

            const data = await response.json();
            setAttendanceData(data);
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


    // Calculate stats
    const presentCount = attendanceData.filter(r => r.status === 'Present').length;
    const absentCount = attendanceData.filter(r => r.status === 'Absent').length; // Note: history view might not have 'Absent' rows
    const lateCount = attendanceData.filter(r => {
        // Simple string check for now, backend could provide simpler flag
        // Assuming backend sets status 'Late' or we check logic here.
        // Backend currently sends 'Late' status if applicable in some logic, or 'Present'.
        // Let's trust the status string from backend or the explicit checkIn time if needed.
        // For this UI, let's rely on status 'Late' if backend sends it, OR checkIn time if we want to be strict.
        return r.status === 'Late';
        // Note: My backend adminAttendance code used simple status from DB.
        // Employee attendance.ts calculated 'Late'.
        // Let's assume the DB status is updated or we trust the DB 'status' column.
        // If DB status is just 'Present', we might miss 'Late'.
        // Quick fix: The backend SQL 'COALESCE(a.status, 'Absent')' uses DB status.
        // We should depend on DB status.
    }).length;

    // For "Late", if database only stores "Present", we might need to check time.
    // But for now let's stick to status.
    const onLeaveCount = attendanceData.filter(r => r.status === 'Half Day' || r.status === 'On Leave' || r.status === 'Leave').length;


    // Logic to handle "Late" calculation if status is just "Present" but time is late?
    // Let's refine the stats to be robust:
    const calculatedLate = attendanceData.filter(r => {
        if (r.status === 'Late') return true;
        if (r.status === 'Present' && r.checkIn !== '-') {
            // Example 9:15 threshold
            const [time, period] = r.checkIn.split(' ');
            const [h, m] = time.split(':').map(Number);
            // 9:15 AM
            if (period === 'AM' && h === 9 && m > 15) return true;
            if (period === 'AM' && h > 9 && h !== 12) return true; // 10 AM, 11 AM
            if (period === 'PM') return true; // Late
            return false;
        }
        return false;
    }).length;

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 -mt-6 lg:-mt-6 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Attendance Monitoring
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Track daily employee check-ins and working hours.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            <Label htmlFor="view-mode" className={`text-sm cursor-pointer ${viewMode === 'daily' ? 'font-bold text-primary' : 'text-slate-500'}`}>Daily</Label>
                            <Switch
                                id="view-mode"
                                checked={viewMode === 'history'}
                                onCheckedChange={(checked) => setViewMode(checked ? 'history' : 'daily')}
                            />
                            <Label htmlFor="view-mode" className={`text-sm cursor-pointer ${viewMode === 'history' ? 'font-bold text-primary' : 'text-slate-500'}`}>History</Label>
                        </div>

                        <Button variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-800 cursor-pointer">
                            <Download className="mr-2 h-4 w-4" /> Export Report
                        </Button>
                    </div>
                </div>

                {/* --- Filters & Navigation --- */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4 transition-all">

                    {viewMode === 'daily' ? (
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
                                disabled={isToday(selectedDate) || isFuture(addDays(selectedDate, 1))}
                                className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-30 dark:bg-slate-800 dark:text-white dark:border-slate-800"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter By:</span>
                            </div>

                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={m.toString()}>
                                            {format(new Date(2000, m - 1, 1), 'MMMM')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[120px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
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

                {/* --- Stats Row --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600"> <CheckCircle2 size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{presentCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">{viewMode === 'daily' ? 'Present Today' : 'Total Present'}</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600"> <XCircle size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{absentCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">{viewMode === 'daily' ? 'Absent Today' : 'Total Absent (Logged)'}</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-600"> <Clock size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{calculatedLate}</p> <p className="text-xs text-slate-500 dark:text-slate-400">Late Arrivals</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600"> <CalendarCheck size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{onLeaveCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">On Leave</p> </div>
                    </Card>
                </div>


                {/* --- Desktop View: Table --- */}
                <Card className="hidden md:block border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                    <div className="p-0 overflow-x-auto">
                        {loading ? (
                            <div className="p-10 text-center text-slate-500">Loading attendance data...</div>
                        ) : attendanceData.length > 0 ? (
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
                                    {attendanceData.map((record, index) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    {record.avatar ? (
                                                        <img src={record.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                            {record.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold">{record.name}</p>
                                                        {record.designation && <p className="text-xs text-slate-500">{record.designation}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{record.date}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{record.checkIn}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{record.checkOut}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-xs">{record.hours}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge variant="outline" className={`
                                            ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                            ${record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${record.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                            ${record.status === 'Half Day' || record.status === 'On Leave' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                        `}>
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
                    ) : attendanceData.length > 0 ? (
                        attendanceData.map((record, index) => (
                            <Card key={index} className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-white">
                                            {record.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-base">{record.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <CalendarCheck className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{record.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`
                                        ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        ${record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                        ${record.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                        ${record.status === 'Half Day' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    `}>
                                        {record.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Check In</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{record.checkIn}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Check Out</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{record.checkOut}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Total Hours
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{record.hours}</span>
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
