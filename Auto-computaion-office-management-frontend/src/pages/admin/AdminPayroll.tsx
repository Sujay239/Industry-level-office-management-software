import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Filter, Search, DollarSign, Send, CheckCircle2, Clock, X, ChevronLeft, ChevronRight, Loader2, ChevronDown, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotification } from "../../components/NotificationProvider";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface PayrollRecord {
    id: number;
    name: string;
    role: string;
    salary: number;
    allowances: number;
    deductions: number;
    netPay: number;
    status: string;
    paymentDate: string;
    month: string;
    avatar: string;
}

const AdminPayroll: React.FC = () => {
    const { showSuccess, showError } = useNotification();

    // 1. GET CURRENT DATE INFO
    const currentDate = new Date();
    const currentYearVal = currentDate.getFullYear();
    const getCurrentMonth = () => {
        return currentDate.toLocaleString('en-US', { month: 'long' });
    };

    // 2. STATE MANAGEMENT
    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
    const [selectedYear, setSelectedYear] = useState<string>(currentYearVal.toString());

    // Generate last 5 years for the dropdown
    const years = Array.from(new Array(5), (_val, index) => (currentYearVal - index).toString());

    // Standard months list
    const availableMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // 3. DYNAMIC FETCH LOGIC
    // Runs on mount and whenever month OR year changes
    // 3. DYNAMIC FETCH LOGIC
    const fetchPayrollData = async () => {
        setIsLoading(true);
        try {
            let url;

            // LOGIC: Check if "All" or Specific Month
            if (selectedMonth === "All") {
                // When 'All' is selected, we fetch all history (Year is ignored/hidden)
                url = `${API_BASE_URL}/payroll/all`;
            } else {
                // When a specific month is selected, we MUST include the Year
                // Using query parameter ?year=YYYY to prevent 404s on existing routes
                // If your backend expects /payroll/Month/Year, change this line accordingly.
                url = `${API_BASE_URL}/payroll/${encodeURIComponent(selectedMonth)}?year=${selectedYear}`;
            }

            const response = await fetch(url, {
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Failed to fetch payroll data");
            }
            const data = await response.json();

            // Handle data.users or fallback
            const recordsArray = data.users || [];

            const mappedRecords: PayrollRecord[] = recordsArray.map((item: any) => ({
                id: item.payroll_id, // Use Payroll ID for updates
                name: item.name,
                role: item.designation,
                salary: parseFloat(item.basic_salary) || 0,
                allowances: parseFloat(item.allowances) || 0,
                deductions: parseFloat(item.deductions) || 0,
                netPay: parseFloat(item.net_salary) || 0,
                status: item.payroll_status,
                paymentDate: item.payment_date,
                month: item.month,
                avatar: item.avatar_url || ""
            }));

            setRecords(mappedRecords);

        } catch (error) {
            console.error("Error fetching payroll data:", error);
            showError("Failed to load payroll records");
        } finally {
            setIsLoading(false);
        }
    };

    // Runs on mount and whenever month OR year changes
    useEffect(() => {
        fetchPayrollData();
    }, [selectedMonth, selectedYear]); // DEPENDENCY ARRAY UPDATED

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<PayrollRecord | null>(null);
    const [editSalary, setEditSalary] = useState("");
    const [editAllowances, setEditAllowances] = useState("");
    const [editDeductions, setEditDeductions] = useState("");
    const [netPayable, setNetPayable] = useState(0);

    // View Details Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);

    const filteredRecords = records.filter(record =>
        (record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.role.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === "All" || record.status === statusFilter)
    );

    const totalPayroll = filteredRecords.reduce((acc, curr) => acc + curr.netPay, 0);
    const paidCount = filteredRecords.filter(r => r.status === "paid").length;
    const pendingCount = filteredRecords.filter(r => r.status === "pending" || r.status === "processing").length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const navList = ["All", ...availableMonths];
        const currentIndex = navList.indexOf(selectedMonth);

        let newIndex;
        if (currentIndex === -1) {
            newIndex = 0;
        } else {
            newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0) newIndex = navList.length - 1;
            if (newIndex >= navList.length) newIndex = 0;
        }

        setSelectedMonth(navList[newIndex]);
    };

    const handleOpenPaymentModal = (record: PayrollRecord) => {
        if (record.status === "paid") {
            showSuccess("This employee has already been paid.");
            return;
        }
        setCurrentRecord(record);
        setEditSalary(record.salary.toString());
        setEditAllowances("");
        setEditDeductions("");
        setNetPayable(record.netPay);
        setIsPaymentModalOpen(true);
    };

    const handleOpenViewModal = (record: PayrollRecord) => {
        setViewRecord(record);
        setIsViewModalOpen(true);
    };

    const handleUpdateStatus = async (recordId: number, newStatus: string) => {
        try {
            const url = `${API_BASE_URL}/payroll/process/${recordId}`;
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update status");
            }

            setRecords(prev => prev.map(rec => {
                if (rec.id === recordId) {
                    return { ...rec, status: newStatus };
                }
                return rec;
            }));

            showSuccess(`Status updated to ${newStatus}`);

        } catch (error: any) {
            console.error("Status update error:", error);
            showError(error.message || "Could not update status");
        }
    };

    React.useEffect(() => {
        const s = parseFloat(editSalary) || 0;
        const a = parseFloat(editAllowances) || 0;
        const d = parseFloat(editDeductions) || 0;
        setNetPayable(s + a - d);
    }, [editSalary, editAllowances, editDeductions]);

    const handleConfirmPayment = async () => {
        if (!currentRecord) {
            showError("No record selected");
            return;
        }

        const url = `${API_BASE_URL}/payroll/pay/${currentRecord.id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                basic_salary: editSalary,
                allowances: editAllowances,
                deductions: editDeductions,
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            showError(errorData.error || "Failed to update payment");
            return;
        }

        setIsPaymentModalOpen(false);
        setCurrentRecord(null);
        fetchPayrollData();
        showSuccess("Payment updated successfully");
    };

    const handleExport = () => {
        if (filteredRecords.length === 0) {
            showError("No records to export");
            return;
        }

        const headers = ["ID", "Name", "Role", "Month", "Status", "Basic Salary", "Allowances", "Deductions", "Net Pay", "Payment Date"];
        const csvContent = [
            headers.join(","),
            ...filteredRecords.map(record => {
                const date = record.paymentDate
                    ? new Date(record.paymentDate).toLocaleDateString('en-GB')
                    : "N/A";
                return [
                    record.id,
                    `"${record.name}"`,
                    `"${record.role}"`,
                    record.month,
                    record.status,
                    record.salary,
                    record.allowances,
                    record.deductions,
                    record.netPay,
                    date
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_export_${selectedMonth}_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            {/* View Details Modal */}
            {isViewModalOpen && viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-md p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-slate-900/5">

                        {/* Decorative Top Bar */}
                        <div className={`h-2 w-full ${viewRecord.status === 'paid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                            viewRecord.status === 'processing' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                'bg-gradient-to-r from-amber-500 to-orange-500'
                            }`} />

                        {/* Close Button - Now more visible */}
                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="p-6 pb-2">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-lg mb-2">
                                    <AvatarImage src={viewRecord.avatar} />
                                    <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-2xl font-bold">
                                        {viewRecord.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{viewRecord.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{viewRecord.role}</p>
                                </div>

                                <Badge className={`px-3 py-1 text-sm font-medium border capitalize mt-2 ${viewRecord.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50' :
                                    viewRecord.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50' :
                                        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50'
                                    }`}>
                                    {viewRecord.status === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1.5 inline" /> : <Clock className="w-3 h-3 mr-1.5 inline" />}
                                    {viewRecord.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="px-6 py-4">
                            <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-center border-b border-slate-200 dark:border-slate-800 pb-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Month</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{viewRecord.month}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                                            {viewRecord.paymentDate
                                                ? new Date(viewRecord.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm group">
                                        <div className="flex items-center text-slate-500 dark:text-slate-400 gap-2">
                                            <div className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <DollarSign className="w-3.5 h-3.5" />
                                            </div>
                                            Basic Salary
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(viewRecord.salary)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm group">
                                        <div className="flex items-center text-slate-500 dark:text-slate-400 gap-2">
                                            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                                                <ChevronRight className="w-3.5 h-3.5 rotate-[-45deg]" />
                                            </div>
                                            Allowances
                                        </div>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">+{formatCurrency(viewRecord.allowances)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm group">
                                        <div className="flex items-center text-slate-500 dark:text-slate-400 gap-2">
                                            <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 shadow-sm">
                                                <ChevronRight className="w-3.5 h-3.5 rotate-[45deg]" />
                                            </div>
                                            Deductions
                                        </div>
                                        <span className="font-medium text-rose-600 dark:text-rose-400">-{formatCurrency(viewRecord.deductions)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">Net Payable</span>
                                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:to-slate-300">
                                            {formatCurrency(viewRecord.netPay)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            <div className="space-y-8">

                {/* --- Header --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            Payroll Management
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Process salaries, view history, and manually update payment status.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer shadow-lg">
                            <Send className="mr-2 h-4 w-4" /> Run Payroll
                        </Button>
                        <Button variant="outline" onClick={handleExport} className="dark:bg-slate-800 dark:text-white dark:border-slate-800 cursor-pointer">
                            <Download className="mr-2 h-4 w-4" /> Export Report
                        </Button>
                    </div>
                </div>

                {/* --- Stats Row --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Payroll Cost</span>
                            <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            ) : (
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalPayroll)}</h2>
                            )}
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                For {selectedMonth === "All" ? "All Months" : `${selectedMonth} ${selectedYear}`}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Employees Paid</span>
                            <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            ) : (
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{paidCount} <span className="text-lg text-slate-400 font-normal">/ {filteredRecords.length}</span></h2>
                            )}
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                All processed successfully
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Process</span>
                            <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            {isLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            ) : (
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{pendingCount}</h2>
                            )}
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Action required
                            </p>
                        </div>
                    </Card>
                </div>

                {/* --- Filters & Search --- */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex gap-2 max-md:flex-wrap w-full md:w-auto items-center">
                        <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')} className="cursor-pointer dark:text-white dark:border-slate-800 shrink-0">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* MONTH SELECTOR */}
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white cursor-pointer">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="All" className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 font-bold">
                                    All Records
                                </SelectItem>
                                {availableMonths.map(month => (
                                    <SelectItem key={month} value={month} className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                                        {month.toLocaleUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* YEAR SELECTOR - CONDITIONALLY RENDERED */}
                        {selectedMonth !== "All" && (
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white cursor-pointer animate-in fade-in zoom-in-95 duration-200">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                    {years.map(year => (
                                        <SelectItem key={year} value={year} className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <Button variant="outline" size="icon" onClick={() => navigateMonth('next')} className="cursor-pointer dark:text-white dark:border-slate-800 shrink-0">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white cursor-pointer shrink-0">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="All" className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">All Status</SelectItem>
                                <SelectItem value="paid" className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Paid</SelectItem>
                                <SelectItem value="pending" className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Pending</SelectItem>
                                <SelectItem value="processing" className="cursor-pointer dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800">Processing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* --- Employee Payroll List --- */}
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <Card className="hidden md:block border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                                        <th className="px-6 py-4 font-medium">Employee</th>
                                        <th className="px-6 py-4 font-medium">Month</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium">Net Pay</th>
                                        <th className="px-6 py-4 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="relative">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="h-32 text-center text-slate-500">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Loading records for {selectedMonth} {selectedMonth !== 'All' ? selectedYear : ''}...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="h-32 text-center text-slate-500">
                                                No records found for {selectedMonth} {selectedMonth !== 'All' ? selectedYear : ''}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map((record) => (
                                            <tr key={record.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                                                            <AvatarImage src={record.avatar} />
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{record.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white text-sm">{record.name}</div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-500">{record.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{record.month}</td>
                                                <td className="px-6 py-4">
                                                    {record.status === 'paid' ? (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <Badge
                                                                variant="outline"
                                                                className="capitalize bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                                            >
                                                                {record.status}
                                                                <CheckCircle2 className="h-3 w-3 ml-1" />
                                                            </Badge>
                                                            {record.paymentDate ? (
                                                                <span className="text-[10px] text-slate-500 font-medium ml-1">
                                                                    {new Date(record.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 font-medium ml-1">
                                                                    Date not available
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`
                                                                        capitalize cursor-pointer
                                                                        ${record.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : ''}
                                                                        ${record.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' : ''}
                                                                        `}
                                                                    >
                                                                        {record.status}
                                                                        <ChevronDown className="h-3 w-3 ml-1" />
                                                                    </Badge>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(record.id, 'pending')} className="cursor-pointer dark:text-white dark:focus:bg-slate-800">
                                                                        Mark as Pending
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(record.id, 'processing')} className="cursor-pointer dark:text-white dark:focus:bg-slate-800">
                                                                        Mark as Processing
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                                                                Payment not done yet
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white text-sm">
                                                    {record.status === 'paid' ? formatCurrency(record.netPay) : <span className="text-slate-400 text-xs italic">Not Disbursed</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenViewModal(record)}
                                                            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-500"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {record.status !== "paid" ? (
                                                            <Button
                                                                onClick={() => handleOpenPaymentModal(record)}
                                                                size="sm"
                                                                className="cursor-pointer bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200"
                                                            >
                                                                Pay Now
                                                            </Button>
                                                        ) : (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer">
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4">
                        {isLoading ? (
                            <div className="h-32 flex items-center justify-center text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
                            </div>
                        ) : filteredRecords.length === 0 ? (
                            <div className="h-20 flex items-center justify-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300">
                                No records found.
                            </div>
                        ) : (
                            filteredRecords.map((record) => (
                                <Card key={record.id} className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                                <AvatarImage src={record.avatar} />
                                                <AvatarFallback className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{record.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{record.name}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{record.role}</p>
                                            </div>
                                        </div>
                                        {record.status === 'paid' ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30"
                                                >
                                                    {record.status}
                                                    <CheckCircle2 className="h-3 w-3 ml-1" />
                                                </Badge>
                                                {record.paymentDate ? (
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {new Date(record.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        Date not available
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-1">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Badge
                                                            variant="outline"
                                                            className={`
                                                            capitalize cursor-pointer
                                                            ${record.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : ''}
                                                            ${record.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' : ''}
                                                            `}
                                                        >
                                                            {record.status}
                                                            <ChevronDown className="h-3 w-3 ml-1" />
                                                        </Badge>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record.id, 'pending')} className="cursor-pointer dark:text-white dark:focus:bg-slate-800">
                                                            Mark as Pending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatus(record.id, 'processing')} className="cursor-pointer dark:text-white dark:focus:bg-slate-800">
                                                            Mark as Processing
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    Payment not done yet
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Month</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-300">{record.month}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">Net Pay</p>
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {record.status === 'paid' ? formatCurrency(record.netPay) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => handleOpenViewModal(record)}
                                            className="flex-1 cursor-pointer dark:border-slate-800 dark:text-white"
                                        >
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </Button>
                                        {record.status !== "paid" && (
                                            <Button
                                                onClick={() => handleOpenPaymentModal(record)}
                                                className="flex-1 cursor-pointer bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200"
                                            >
                                                Pay Now
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* --- Process Payment Modal --- */}
            {isPaymentModalOpen && currentRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Process Payment</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Update payment status for {currentRecord.name}.</p>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsPaymentModalOpen(false)}>
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Base Salary</label>
                                    <Input
                                        type="number"
                                        value={editSalary}
                                        readOnly
                                        disabled
                                        className="bg-white dark:bg-slate-950 dark:text-white opacity-70 cursor-not-allowed"
                                        placeholder="Enter base salary"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        To change the base salary, please edit the employee details in the Employees tab before paying.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Allowances</label>
                                    <Input
                                        type="number"
                                        value={editAllowances}
                                        onChange={(e) => setEditAllowances(e.target.value)}
                                        className="bg-white dark:bg-slate-950 text-green-600 dark:text-green-400"
                                        placeholder="Enter allowances"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Deductions</label>
                                    <Input
                                        type="number"
                                        value={editDeductions}
                                        onChange={(e) => setEditDeductions(e.target.value)}
                                        className="bg-white dark:bg-slate-950 text-red-500 dark:text-red-400"
                                        placeholder="Enter deductions"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Net Payable</span>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(netPayable)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Net Pay = Base Salary + Allowances - Deductions
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white">Cancel</Button>
                            <Button onClick={handleConfirmPayment} className="bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-lg shadow-green-900/20">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm & Pay
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
};

export default AdminPayroll;
