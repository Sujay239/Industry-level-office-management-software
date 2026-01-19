import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, CheckCircle, XCircle, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotification } from "../../components/NotificationProvider";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface LeaveRequest {
    id: number;
    name: string;
    type: string;
    dates: string;
    start_date: string;
    days: number;
    reason: string;
    status: string;
    avatar: string;
}

const AdminLeaves: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [activeTab, setActiveTab] = useState("All");
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleApprove = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/leaves/approve/${id}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!response.ok) throw new Error("Failed to approve leave");
            showSuccess("Leave approved successfully");
            fetchLeaves();
        } catch (error) {
            console.error(error);
            showError("Failed to approve leave");
        }
    };

    const handleReject = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/leaves/reject/${id}`, {
                method: 'PUT',
                credentials: 'include'
            });
            if (!response.ok) throw new Error("Failed to reject leave");
            showSuccess("Leave rejected successfully");
            fetchLeaves();
        } catch (error) {
            console.error(error);
            showError("Failed to reject leave");
        }
    };

    const fetchLeaves = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/leaves/all`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error("Failed to fetch leave requests");
            const data = await response.json();
            setLeaveRequests(data);
        } catch (error) {
            console.error(error);
            showError("Could not load leave requests");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* --- Header --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6">
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                        Leave Management
                    </h1>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                        Review and manage employee leave requests.
                    </p>
                </div>

                {/* --- Tabs --- */}
                <div className="flex space-x-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1 w-fit">
                    {["Pending", "Approved", "Rejected", "All"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${activeTab === tab
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                                }
                    `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- Requests List --- */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <>
                            {leaveRequests
                                .filter(r => activeTab === "All" || r.status === activeTab)
                                .map((req) => {
                                    const isEditable = new Date(req.start_date) > new Date();
                                    return (
                                        <Card key={req.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col md:flex-row gap-6 md:items-center justify-between transition-all hover:shadow-md">

                                            <div className="flex gap-4 items-start">
                                                <Avatar className="h-12 w-12 border border-slate-100 dark:border-slate-700">
                                                    <AvatarImage src={req.avatar} />
                                                    <AvatarFallback className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{req.name.charAt(0)}</AvatarFallback>
                                                </Avatar>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-slate-900 dark:text-white">{req.name}</h3>
                                                        <Badge variant="outline" className="text-xs font-normal text-slate-500 dark:text-slate-400">{req.type}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {req.dates}</span>
                                                        <span>•</span>
                                                        <span>{req.days} days</span>
                                                    </div>
                                                    <p className="text-sm mt-3 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg inline-block">
                                                        "{req.reason}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Pending Actions */}
                                                {req.status === 'Pending' && (
                                                    <>
                                                        <Button onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700 text-white shadow-green-900/10 cursor-pointer">
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                                        </Button>
                                                        <Button onClick={() => handleReject(req.id)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 cursor-pointer">
                                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Status & Revert Actions */}
                                                {req.status !== 'Pending' && (
                                                    <div className="flex items-center gap-2">
                                                        {isEditable && req.status === 'Rejected' && (
                                                            <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)} className="text-green-600 border-green-200 hover:bg-green-50 mr-2 cursor-pointer">
                                                                Switch to Approve
                                                            </Button>
                                                        )}
                                                        {isEditable && req.status === 'Approved' && (
                                                            <Button size="sm" variant="outline" onClick={() => handleReject(req.id)} className="text-red-600 border-red-200 hover:bg-red-50 mr-2 cursor-pointer">
                                                                Switch to Reject
                                                            </Button>
                                                        )}

                                                        <Badge className={`
                                                    px-3 py-1 text-sm
                                                    ${req.status === 'Approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400' : ''}
                                                    ${req.status === 'Rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400' : ''}
                                                 `}>
                                                            {req.status === 'Approved' && <CheckCircle className="w-3 h-3 mr-2 inline" />}
                                                            {req.status === 'Rejected' && <XCircle className="w-3 h-3 mr-2 inline" />}
                                                            {req.status}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                        </Card>
                                    );
                                })}

                            {leaveRequests.filter(r => activeTab === "All" || r.status === activeTab).length === 0 && (
                                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No {activeTab.toLowerCase()} leave requests found.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdminLeaves;
