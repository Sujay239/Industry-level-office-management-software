import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ShieldAlert, Loader2, Network } from "lucide-react";
import { useNotification } from "../../components/NotificationProvider"; // Assuming this path based on other files
import { format } from "date-fns";

// --- Types ---
interface AllowedIP {
    id: number;
    ip_address: string;
    label: string;
    created_at: string;
}

const AllowedIPs: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API_BASE_URL = (import.meta as any).env.VITE_BASE_URL;
    const { showSuccess, showError } = useNotification();

    const [ips, setIps] = useState<AllowedIP[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newIp, setNewIp] = useState("");
    const [newLabel, setNewLabel] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch IPs
    const fetchIps = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ips`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setIps(data);
            } else {
                // If the route doesn't exist yet, we might get 404. Handle gracefully.
                console.error("Failed to fetch allowed IPs");
            }
        } catch (error) {
            console.error("Error fetching IPs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIps();
    }, []);

    // Add IP Handler
    const handleAddIp = async () => {
        if (!newIp) {
            showError("IP Address is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ips/add`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: 'include',
                body: JSON.stringify({ ip_address: newIp, label: newLabel }),
            });

            const data = await response.json();

            if (response.ok) {
                showSuccess("IP Address added successfully");
                setIps([data.ip, ...ips]); // Prepend new IP
                setIsAddModalOpen(false);
                setNewIp("");
                setNewLabel("");
            } else {
                showError(data.message || "Failed to add IP");
            }
        } catch (error) {
            console.error("Error adding IP:", error);
            showError("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete IP Handler
    const handleDeleteIp = async (id: number) => {
        if (!confirm("Are you sure you want to remove this IP restriction?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/ips/${id}`, {
                method: "DELETE",
                credentials: 'include',
            });

            if (response.ok) {
                showSuccess("IP removed successfully");
                setIps(ips.filter(ip => ip.id !== id));
            } else {
                const data = await response.json();
                showError(data.message || "Failed to remove IP");
            }
        } catch (error) {
            console.error("Error removing IP:", error);
            showError("An error occurred");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Allowed IP Addresses</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Manage the IP addresses authorized for employee clock-ins.
                        </p>
                    </div>
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer">
                                <Plus size={18} className="mr-2" /> Add Allowed IP
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                            <DialogHeader>
                                <DialogTitle className="dark:text-white">Add New IP Address</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-white">
                                    Enter the IP address (IPv4 or IPv6) and a label to identify it.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Label (Optional)</label>
                                    <Input
                                        placeholder="e.g. Office HQ Details"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        className="dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">IP Address</label>
                                    <Input
                                        placeholder="e.g. 192.168.1.1"
                                        value={newIp}
                                        onChange={(e) => setNewIp(e.target.value)}
                                        className="font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleAddIp}
                                    disabled={isSubmitting}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
                                >
                                    {isSubmitting ? "Adding..." : "Add IP"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3 text-blue-700 dark:text-blue-400">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-semibold mb-1">Security Restriction Active</p>
                        <p>Only employees connecting from these IP addresses will be able to clock in/out. Admins are exempt from this restriction.</p>
                    </div>
                </div>

                {/* Content */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                    <CardHeader>
                        <CardTitle className="dark:text-white flex items-center gap-2">
                            <Network size={20} className="text-slate-400" />
                            Authorized Networks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ips.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                No allowed IPs configured. Add one to start restricting access.
                                <br />
                                <span className="text-xs opacity-70">(Without any IPs, users might be blocked or allowed depending on backend configuration)</span>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                        <TableHead className="w-[100px] text-slate-700 dark:text-slate-300">ID</TableHead>
                                        <TableHead className="text-slate-700 dark:text-slate-300">IP Address</TableHead>
                                        <TableHead className="text-slate-700 dark:text-slate-300">Label</TableHead>
                                        <TableHead className="text-slate-700 dark:text-slate-300">Added On</TableHead>
                                        <TableHead className="text-right text-slate-700 dark:text-slate-300">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ips.map((ip) => (
                                        <TableRow key={ip.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20 border-slate-100 dark:border-slate-800 transition-colors">
                                            <TableCell className="font-mono text-xs text-slate-500">#{ip.id}</TableCell>
                                            <TableCell className="font-mono font-medium text-slate-900 dark:text-white">
                                                {ip.ip_address}
                                            </TableCell>
                                            <TableCell className="text-slate-600 dark:text-slate-400">
                                                {ip.label ? (
                                                    <Badge variant="outline" className="font-normal border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                                        {ip.label}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-slate-400 italic">No label</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">
                                                {ip.created_at ? format(new Date(ip.created_at), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteIp(ip.id)}
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AllowedIPs;
