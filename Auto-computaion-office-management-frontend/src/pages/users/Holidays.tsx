import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, CalendarCheck } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Holiday {
    id: number;
    name: string;
    date: string;
    day: string;
    type: string;
}

const Holidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/holidays/all`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch holidays');
            const data = await response.json();
            setHolidays(data);
        } catch (error) {
            console.error(error);
            showError('Failed to load holidays');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(`Office Holiday List - ${new Date().getFullYear()}`, 14, 22);

        // Add Generation Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Prepare Data
        const tableColumn = ["Date", "Day", "Holiday Name", "Type"];
        const tableRows = holidays.map(holiday => [
            new Date(holiday.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
            holiday.day,
            holiday.name,
            holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)
        ]);

        // Generate Table
        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: {
                fillColor: [37, 99, 235], // Blue-600
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            columnStyles: {
                0: { cellWidth: 40 }, // Date
                1: { cellWidth: 30 }, // Day
                2: { cellWidth: 'auto' }, // Name
                3: { cellWidth: 40 } // Type
            }
        });

        doc.save('HolidayList.pdf');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 max-sm:hidden">
                            <CalendarCheck className="h-8 w-8 text-blue-600 dark:!text-white" /> Holidays
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Office holiday calendar for the current year.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white cursor-pointer"
                        onClick={handleDownloadPDF}
                    >
                        <Download className="h-4 w-4" />
                        Download List
                    </Button>
                </div>

                {/* Holidays List */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming & Past Holidays</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* Today Sections */}
                        {holidays.filter(h => new Date(h.date).toDateString() === new Date().toDateString()).length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Today
                                </h3>
                                {holidays.filter(h => new Date(h.date).toDateString() === new Date().toDateString()).map(holiday => (
                                    <HolidayItem key={holiday.id} holiday={holiday} isToday={true} />
                                ))}
                            </div>
                        )}

                        {/* Upcoming Sections */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Upcoming</h3>
                            {holidays.filter(h => new Date(h.date) > new Date() && new Date(h.date).toDateString() !== new Date().toDateString()).length === 0 ? (
                                <div className="text-sm text-slate-500 italic pl-2">No upcoming holidays.</div>
                            ) : (
                                holidays
                                    .filter(h => new Date(h.date) > new Date() && new Date(h.date).toDateString() !== new Date().toDateString())
                                    .map(holiday => (
                                        <HolidayItem key={holiday.id} holiday={holiday} />
                                    ))
                            )}
                        </div>

                        {/* Past Sections */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Past Holidays</h3>
                            {holidays.filter(h => new Date(h.date) < new Date() && new Date(h.date).toDateString() !== new Date().toDateString()).length === 0 ? (
                                <div className="text-sm text-slate-500 italic pl-2">No past holidays.</div>
                            ) : (
                                holidays
                                    .filter(h => new Date(h.date) < new Date() && new Date(h.date).toDateString() !== new Date().toDateString())
                                    .map(holiday => (
                                        <HolidayItem key={holiday.id} holiday={holiday} isPast={true} />
                                    ))
                            )}
                        </div>

                    </CardContent>
                </Card>

            </div>
        </div >
    );
};

const HolidayItem = ({ holiday, isPast = false, isToday = false }: { holiday: Holiday, isPast?: boolean, isToday?: boolean }) => {
    return (
        <div className={`flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 transition-colors ${isPast ? 'dark:bg-slate-900/20 opacity-60' : 'dark:bg-slate-800/30'} ${isToday ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10' : 'dark:border-slate-800'}`}>
            <div className="flex items-center gap-4">
                <div className={`flex flex-col items-center justify-center h-12 w-12 rounded-lg  ${isPast ? 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500' : isToday ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    <span className="text-xs font-bold uppercase">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg font-bold leading-none">{new Date(holiday.date).getDate()}</span>
                </div>
                <div>
                    <h3 className={`font-semibold ${isPast ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{holiday.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{holiday.day} • {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}</p>
                </div>
            </div>
        </div>
    );
}

export default Holidays;
