import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarCheck, Download, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, addDays, isToday, isFuture } from "date-fns";

const getMockData = () => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const dayBefore = subDays(today, 2);

    return [
        // Today's Data
        { id: 1, name: "Alice Johnson", date: format(today, "yyyy-MM-dd"), checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present", hours: "9h 00m" },
        { id: 2, name: "Bob Smith", date: format(today, "yyyy-MM-dd"), checkIn: "09:15 AM", checkOut: "06:10 PM", status: "Late", hours: "8h 55m" },
        { id: 3, name: "Charlie Brown", date: format(today, "yyyy-MM-dd"), checkIn: "-", checkOut: "-", status: "Absent", hours: "-" },
        { id: 4, name: "David Wilson", date: format(today, "yyyy-MM-dd"), checkIn: "08:55 AM", checkOut: "05:00 PM", status: "Half Day", hours: "4h 05m" },
        { id: 5, name: "Sujay Kumar", date: format(today, "yyyy-MM-dd"), checkIn: "09:05 AM", checkOut: "06:15 PM", status: "Present", hours: "9h 10m" },

        // Yesterday's Data
        { id: 6, name: "Alice Johnson", date: format(yesterday, "yyyy-MM-dd"), checkIn: "08:58 AM", checkOut: "06:02 PM", status: "Present", hours: "9h 04m" },
        { id: 7, name: "Bob Smith", date: format(yesterday, "yyyy-MM-dd"), checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present", hours: "9h 00m" },
        { id: 8, name: "Charlie Brown", date: format(yesterday, "yyyy-MM-dd"), checkIn: "09:30 AM", checkOut: "06:30 PM", status: "Late", hours: "9h 00m" },
        { id: 9, name: "David Wilson", date: format(yesterday, "yyyy-MM-dd"), checkIn: "-", checkOut: "-", status: "Absent", hours: "-" },
        { id: 10, name: "Sujay Kumar", date: format(yesterday, "yyyy-MM-dd"), checkIn: "09:10 AM", checkOut: "06:20 PM", status: "Present", hours: "9h 10m" },

        // Day Before Yesterday
        { id: 11, name: "Alice Johnson", date: format(dayBefore, "yyyy-MM-dd"), checkIn: "09:00 AM", checkOut: "06:00 PM", status: "Present", hours: "9h 00m" },
    ];
};

const attendanceData = getMockData();

const AdminAttendance: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const displayDate = format(selectedDate, "EEEE, d MMMM yyyy");

    const filteredData = attendanceData.filter(record => record.date === formattedDate);

    // Calculate stats for the selected date
    const presentCount = filteredData.filter(r => r.status === 'Present').length;
    const absentCount = filteredData.filter(r => r.status === 'Absent').length;
    const lateCount = filteredData.filter(r => r.status === 'Late').length;
    const leaveCount = filteredData.filter(r => r.status === 'Half Day' || r.status === 'On Leave').length; // Assuming Half Day counts towards leave or similar category

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 lg:p-10 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 -mt-6 lg:-mt-6 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Attendance Monitoring
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Track daily employee check-ins and working hours.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-800 cursor-pointer">
                            <Download className="mr-2 h-4 w-4" /> Export Report
                        </Button>
                    </div>
                </div>

                {/* --- Date Navigation --- */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                        <span className="font-semibold text-slate-900 dark:text-white text-lg max-sm:text-[12px]">
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
                </div>

                {/* --- Stats Row --- */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600"> <CheckCircle2 size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{presentCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">Present Today</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600"> <XCircle size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{absentCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">Absent</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-600"> <Clock size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{lateCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">Late Arrivals</p> </div>
                    </Card>
                    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600"> <CalendarCheck size={24} /> </div>
                        <div> <p className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{leaveCount}</p> <p className="text-xs text-slate-500 dark:text-slate-400">On Leave</p> </div>
                    </Card>
                </div>


                {/* --- Desktop View: Table --- */}
                <Card className="hidden md:block border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                    <div className="p-0 overflow-x-auto">
                        {filteredData.length > 0 ? (
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
                                    {filteredData.map((record) => (
                                        <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{record.name}</td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{record.date}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{record.checkIn}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{record.checkOut}</td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-xs">{record.hours}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge variant="outline" className={`
                                            ${record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                            ${record.status === 'Absent' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${record.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                            ${record.status === 'Half Day' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
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
                                <p>No attendance records found for this date.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* --- Mobile View: Cards --- */}
                <div className="md:hidden space-y-4">
                    {filteredData.length > 0 ? (
                        filteredData.map((record) => (
                            <Card key={record.id} className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{record.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CalendarCheck className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{record.date}</span>
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
                            <p>No attendance records found for this date.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminAttendance;
