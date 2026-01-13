import React, { useState, useEffect } from "react";
import { useNotification } from "../../components/NotificationProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Mail, Phone, MapPin, X, Eye, Calendar, Briefcase, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

interface PastEmployee {
    id: number;
    name: string;
    role: string;
    department: string;
    status: string;
    email: string;
    phone: string;
    location: string;
    avatar: string;
    joiningDate: string;
    departureDate: string;
    departureReason: string;
    skills: string[];
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const PastEmployees: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [pastEmployees, setPastEmployees] = useState<PastEmployee[]>([]);

    const fetchPastEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/emp/allPastEmp`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to fetch past employees");

            const data = await response.json();

            const mappedEmployees = data.users.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                role: emp.designation,

                email: emp.email,
                phone: emp.phone,
                location: emp.location,
                avatar: "", // No avatar in past_employees table currently
                joiningDate: emp.joining_date ? emp.joining_date.split("T")[0] : "N/A",
                departureDate: emp.exit_date ? emp.exit_date.split("T")[0] : "N/A",
                departureReason: emp.reason_for_exit,
                skills: emp.skills || []
            }));

            setPastEmployees(mappedEmployees);
        } catch (error) {
            console.error(error);
            showError("Failed to load past employees");
        }
    };

    useEffect(() => {
        fetchPastEmployees();
    }, []);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState<PastEmployee | null>(null);

    const openViewModal = (employee: PastEmployee) => {
        setViewingEmployee(employee);
        setIsViewModalOpen(true);
    };

    // -- Delete Confirmation --
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // We already have viewingEmployee, so we can use that for deletion context if the delete button is inside the modal.
    // If we want to delete from the list directly, we might need a separate state or just set viewingEmployee.

    const confirmDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    const handlePermanentDelete = async () => {
        if (!viewingEmployee) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/emp/permanentRemoveEmp/${viewingEmployee.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete employee");
            }

            // Success
            setPastEmployees((prev) => prev.filter(emp => emp.id !== viewingEmployee.id));
            setIsViewModalOpen(false);
            setIsDeleteDialogOpen(false);
            setViewingEmployee(null);
            showSuccess("Employee record permanently deleted");
        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to delete employee");
        }
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
        months -= startDate.getMonth();
        months += endDate.getMonth();

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;

        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
        }
        return `${months} month${months !== 1 ? 's' : ''}`;
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* --- Header --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            Past Employees
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Archives of former team members.
                        </p>
                    </div>
                </div>

                {/* --- Filters & Search --- */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search archives..." className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500" />
                    </div>
                </div>

                {/* --- Employee Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {pastEmployees.map((employee) => (
                        <Card key={employee.id} className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">

                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm grayscale opacity-80">
                                        <AvatarImage src={employee.avatar} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-lg dark:bg-slate-800 dark:text-slate-400">{employee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{employee.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{employee.role}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">

                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Calendar className="h-4 w-4 mr-3 text-slate-400" /> Left: {employee.departureDate}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Briefcase className="h-4 w-4 mr-3 text-slate-400 shrink-0" />
                                        <span className="truncate" title={employee.departureReason}>
                                            Reason: {employee.departureReason || "Not Specified"}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer"
                                    onClick={() => openViewModal(employee)}
                                >
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

            </div>

            {/* --- View Employee Modal --- */}
            {isViewModalOpen && viewingEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] overflow-y-auto">

                        {/* Header Banner */}
                        <div className="bg-slate-100 dark:bg-slate-900 h-32 w-full relative shrink-0">
                            <div className="absolute inset-0 bg-stripes-slate opacity-10"></div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full cursor-pointer bg-white/50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 backdrop-blur-md"
                                onClick={() => setIsViewModalOpen(false)}
                            >
                                <X className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                            </Button>
                        </div>

                        <div className="px-6 pb-6 -mt-12 relative flex-1">
                            {/* Profile Header */}
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-950 shadow-lg mb-4 grayscale">
                                    <AvatarImage src={viewingEmployee.avatar} />
                                    <AvatarFallback className="text-3xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{viewingEmployee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingEmployee.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">{viewingEmployee.role}</p>
                                <div className="flex gap-2 mt-3">
                                    <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-900/10 dark:border-slate-700">
                                        Former Employee
                                    </Badge>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-6 mt-8">
                                <div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" /> Email
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 truncate" title={viewingEmployee.email}>{viewingEmployee.email}</div>
                                </div>
                                <div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" /> Phone
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{viewingEmployee.phone}</div>
                                </div>
                                <div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" /> Joined
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{viewingEmployee.joiningDate}</div>
                                </div>
                                <div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <Calendar className="w-3.5 h-3.5 mr-2 text-slate-400" /> Left
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 font-semibold text-red-500">{viewingEmployee.departureDate}</div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" /> Location
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{viewingEmployee.location}</div>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mb-1">
                                        <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" /> Tenure
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                        {calculateDuration(viewingEmployee.joiningDate, viewingEmployee.departureDate)}
                                    </div>
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Skills & Expertise</label>
                                <div className="flex flex-wrap gap-2">
                                    {viewingEmployee.skills && viewingEmployee.skills.length > 0 ? (
                                        viewingEmployee.skills.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {skill}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">No skills listed</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Detailed Reason for Departure</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {viewingEmployee.departureReason}. The employee record has been archived and access to company systems has been revoked.
                                </p>
                            </div>

                            <div className="mt-8">
                                <Button
                                    variant="destructive"
                                    className="w-full cursor-pointer opacity-90 hover:opacity-100 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                                    onClick={confirmDelete}
                                >
                                    <X className="w-4 h-4 mr-2" /> Permanently Delete Record
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                                    This action cannot be undone. This will permanently delete <b>{viewingEmployee?.name}</b>'s record from the archives.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handlePermanentDelete} className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 border-none cursor-pointer">Delete Permanently</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </div>
    );
};

export default PastEmployees;
