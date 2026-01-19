import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    RefreshCw,
} from "lucide-react";
import { useNotification } from "@/components/NotificationProvider";

interface AuditLog {
    id: number;
    action: string;
    entity_name: string;
    entity_id: number;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    actor_name: string;
    actor_email: string;
    actor_avatar: string;
    actor_role: string;
    actor_designation: string;
}

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const AuditLogs: React.FC = () => {
    const { showError } = useNotification();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        total: 0,
        page: 1,
        limit: 15,
        totalPages: 1,
    });
    const [isLoading, setIsLoading] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const fetchLogs = async (page: number = 1) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${BASE_URL}/superadmin/audit-logs?page=${page}&limit=${pagination.limit}`,
                {
                    credentials: "include",
                }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch logs");
            }
            const data = await response.json();
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (error) {
            console.error(error);
            showError("Failed to load audit logs");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [BASE_URL]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage);
        }
    };

    const formatDetails = (details: any) => {
        if (!details) return "-";
        // If it's a simple object, display key-value pairs nicely
        return (
            <div className="max-w-xs overflow-hidden text-ellipsis text-xs font-mono text-slate-500 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800">
                {JSON.stringify(details, null, 2)}
            </div>
        );
    };

    const getActionColor = (action: string) => {
        if (action.includes("DELETE") || action.includes("REJECT")) return "destructive";
        if (action.includes("UPDATE") || action.includes("CHANGE")) return "secondary"; // Blueish/Grey
        if (action.includes("CREATE") || action.includes("ASSIGN") || action.includes("APPROVE") || action.includes("SENT")) return "default"; // Greenish usually w/ Badge default
        return "outline";
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 max-sm:hidden">
                            <ShieldAlert className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            Audit Logs
                        </h1>
                        <p className="text-slate-500 dark:text-slate-200 mt-1">
                            Track all system activities, security events, and administrative actions.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLogs(pagination.page)}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Content Card */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="text-slate-900 dark:text-white">System Activity</CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-200">
                            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-950">
                                    <TableRow>
                                        <TableHead className="w-[180px] text-slate-900 dark:text-white">Timestamp</TableHead>
                                        <TableHead className="text-slate-900 dark:text-white">User / Actor</TableHead>
                                        <TableHead className="text-slate-900 dark:text-white">Action</TableHead>
                                        <TableHead className="text-slate-900 dark:text-white">Entity</TableHead>
                                        <TableHead className="hidden md:table-cell text-slate-900 dark:text-white">Details</TableHead>
                                        <TableHead className="hidden lg:table-cell text-slate-900 dark:text-white">IP Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Loading logs...
                                            </TableCell>
                                        </TableRow>
                                    ) : logs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <TableCell className="font-medium text-slate-600 dark:text-slate-200 text-xs">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {log.actor_avatar && (
                                                            <img
                                                                src={log.actor_avatar}
                                                                alt=""
                                                                className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                            />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {log.actor_name || "Unknown"}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-300">
                                                                {log.actor_email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getActionColor(log.action) as any} className="whitespace-nowrap dark:text-white">
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-700 dark:text-slate-200">
                                                    {log.entity_name} <span className="text-xs text-slate-400 dark:text-slate-300">#{log.entity_id || '-'}</span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {formatDetails(log.details)}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-xs font-mono text-slate-500 dark:text-slate-300">
                                                    {log.ip_address || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-slate-500 dark:text-slate-200">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <div className="flex items-center gap-2 dark:text-white text-black">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page <= 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 dark:text-white text-black" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages || isLoading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AuditLogs;
