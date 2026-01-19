import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Trash2, Plus, Loader2, Pencil, X, Download } from 'lucide-react';
import { useNotification } from '../../components/NotificationProvider';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Holiday {
    id: number;
    name: string;
    date: string;
    day: string;
    type: string;
}

const AdminHolidays: React.FC = () => {
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'national' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);

    const { showSuccess, showError } = useNotification();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHoliday.name || !newHoliday.date) {
            showError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingHoliday) {
                // Update existing holiday
                const response = await fetch(`${API_BASE_URL}/admin/holidays/update/${editingHoliday.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(newHoliday)
                });
                if (!response.ok) throw new Error('Failed to update holiday');
                const updated = await response.json();

                setHolidays(prev => prev.map(h => h.id === updated.id ? updated : h).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                showSuccess('Holiday updated successfully');
                cancelEditing();
            } else {
                // Add new holiday
                const response = await fetch(`${API_BASE_URL}/admin/holidays/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(newHoliday)
                });

                if (!response.ok) throw new Error('Failed to add holiday');

                const addedHoliday = await response.json();
                setHolidays(prev => [...prev, addedHoliday].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                showSuccess('Holiday added successfully');
                setNewHoliday({ name: '', date: '', type: 'national' });
            }
        } catch (error) {
            console.error(error);
            showError(editingHoliday ? 'Failed to update holiday' : 'Failed to add holiday');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startEditing = (holiday: Holiday) => {
        setEditingHoliday(holiday);
        // Format date to YYYY-MM-DD using local time components to avoid timezone shifts
        const d = new Date(holiday.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setNewHoliday({ name: holiday.name, date: dateStr, type: holiday.type });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditing = () => {
        setEditingHoliday(null);
        setNewHoliday({ name: '', date: '', type: 'national' });
    };

    const confirmDeleteHoliday = (id: number) => {
        setDeleteConfirmationId(id);
    };

    const handleDeleteHoliday = async () => {
        if (deleteConfirmationId === null) return;
        const id = deleteConfirmationId;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/holidays/remove/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to delete holiday');

            setHolidays(prev => prev.filter(h => h.id !== id));
            showSuccess('Holiday removed successfully');
            if (editingHoliday?.id === id) cancelEditing();
        } catch (error) {
            console.error(error);
            showError('Failed to delete holiday');
        } finally {
            setDeleteConfirmationId(null);
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
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3 max-sm:hidden">
                                <CalendarIcon className="h-8 w-8 text-blue-600 dark:!text-white" /> Holiday Management
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">
                                Manage the office holiday calendar for the current year.
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Add/Edit Holiday Form */}
                    <Card className="md:col-span-1 h-fit border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                            </CardTitle>
                            {editingHoliday && (
                                <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-8 w-8 p-0 cursor-pointer">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Holiday Name</label>
                                    <Input
                                        placeholder="e.g. Independence Day"
                                        value={newHoliday.name}
                                        onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                                    <Input
                                        type="date"
                                        value={newHoliday.date}
                                        onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:ring-offset-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                        value={newHoliday.type}
                                        onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                                    >
                                        <option value="national">National Holiday</option>
                                        <option value="festivals">Festival</option>
                                        <option value="gazetted">Gazetted</option>
                                        <option value="observance">Observance</option>
                                    </select>
                                </div>
                                <Button type="submit" disabled={isSubmitting} className={`w-full text-white cursor-pointer ${editingHoliday ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingHoliday ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                    {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Holidays List */}
                    <Card className="md:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">All Holidays</CardTitle>
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
                                        <HolidayItem key={holiday.id} holiday={holiday} onDelete={confirmDeleteHoliday} onEdit={startEditing} isToday={true} />
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
                                            <HolidayItem key={holiday.id} holiday={holiday} onDelete={confirmDeleteHoliday} onEdit={startEditing} />
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
                                            <HolidayItem key={holiday.id} holiday={holiday} onDelete={confirmDeleteHoliday} onEdit={startEditing} isPast={true} />
                                        ))
                                )}
                            </div>

                        </CardContent>
                    </Card>

                </div>
            </div>

            <AlertDialog open={deleteConfirmationId !== null} onOpenChange={(open) => !open && setDeleteConfirmationId(null)}>
                <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                            This action cannot be undone. This will permanently delete the holiday from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteHoliday} className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 cursor-pointer border-none">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >

    );
};

const HolidayItem = ({ holiday, onDelete, onEdit, isPast = false, isToday = false }: { holiday: Holiday, onDelete: (id: number) => void, onEdit: (h: Holiday) => void, isPast?: boolean, isToday?: boolean }) => {
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
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(holiday)}
                    className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(holiday.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

export default AdminHolidays;
