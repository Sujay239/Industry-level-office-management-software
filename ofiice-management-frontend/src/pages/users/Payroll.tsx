import React, { useState, useEffect } from "react";
import { Download, DollarSign, Calendar, TrendingUp, AlertCircle, Eye, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- Types ---
interface SalarySlip {
    id: number;
    month: string;
    date: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    status: "paid" | "processing" | "pending";
}

const Payroll: React.FC = () => {
    const [history, setHistory] = useState<SalarySlip[]>([]);
    const [stats, setStats] = useState({
        lastMonthPay: 0,
        ytdDeductions: 0
    });
    const [selectedSlip, setSelectedSlip] = useState<SalarySlip | null>(null);

    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    const fetchPayroll = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee/payroll/history`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data.history);
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch payroll", error);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, []);

    // Helper to format currency to INR
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Helper for PDF to avoid symbol issues (jsPDF default fonts don't support ₹)
    const formatForPDF = (amount: number) => {
        return "Rs. " + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const generatePayslip = (slip: SalarySlip) => {
        const doc = new jsPDF();

        // --- 1. Header & Logo ---
        // Load logo image (assuming /logo.png exists at public URL)
        const logoUrl = "/logo.png";
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => {
            doc.addImage(img, 'PNG', 15, 15, 30, 10); // x, y, w, h
            generatePDFContent(doc, slip);
        };

        // Fallback if logo fails (immediately generate text)
        img.onerror = () => {
            generatePDFContent(doc, slip);
        };
    };

    const generatePDFContent = (doc: jsPDF, slip: SalarySlip) => {
        // Company Name
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text("Office Management Pvt Ltd", 195, 20, { align: "right" });

        doc.setFontSize(10);
        doc.text("123 Business Park, Tech City, IN", 195, 26, { align: "right" });
        doc.text("contact@company.com | +91 98765 43210", 195, 31, { align: "right" });

        doc.setLineWidth(0.5);
        doc.line(15, 35, 195, 35); // Horizontal line

        // --- 2. Payslip Title & Month ---
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("PAYSLIP", 105, 50, { align: "center" });
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`For the month of ${slip.month}`, 105, 57, { align: "center" });

        // --- 3. Employee Details (Mock) ---
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Employee Name: Sujay Kumar`, 15, 75); // Static for now, could be dynamic if needed
        doc.text(`Employee ID: EMP-1023`, 15, 80);
        doc.text(`Designation: Software Engineer`, 15, 85);

        doc.text(`Payslip ID: ${slip.id}`, 140, 75);
        doc.text(`Pay Date: ${slip.date}`, 140, 80);
        doc.text(`Bank Account: **** **** 1234`, 140, 85);

        // --- 4. Earnings & Deductions Table ---
        autoTable(doc, {
            startY: 95,
            head: [['Description', 'Earnings (INR)', 'Deductions (INR)']],
            body: [
                ['Basic Salary', formatForPDF(slip.basicSalary), ''],
                ['House Rent Allowance (HRA)', formatForPDF(slip.allowances * 0.4), ''],
                ['Special Allowance', formatForPDF(slip.allowances * 0.6), ''],
                ['Provident Fund (PF)', '', formatForPDF(slip.deductions * 0.5)],
                ['Professional Tax', '', formatForPDF(slip.deductions * 0.2)],
                ['Income Tax (TDS)', '', formatForPDF(slip.deductions * 0.3)],
                ['', '', ''], // Spacer
                [{ content: 'Total', styles: { fontStyle: 'bold' } }, { content: formatForPDF(slip.basicSalary + slip.allowances), styles: { fontStyle: 'bold' } }, { content: formatForPDF(slip.deductions), styles: { fontStyle: 'bold', textColor: [200, 0, 0] } }],
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
        });

        // --- 5. Net Pay Section ---
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFillColor(240, 255, 240); // Light green bg
        doc.rect(15, finalY, 180, 20, 'F');

        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text("NET PAYABLE AMOUNT", 25, finalY + 13);

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(formatForPDF(slip.netSalary), 185, finalY + 13, { align: "right" });

        // --- 6. Footer ---
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("This is a computer-generated document and does not require a signature.", 105, 280, { align: "center" });

        // Save
        doc.save(`Payslip_${slip.month.replace(" ", "_")}.pdf`);
    };

    const exportToCSV = () => {
        // Headers
        const headers = ["ID", "Month", "Date", "Basic Salary", "Allowances", "Deductions", "Net Salary", "Status"];

        // Rows
        const rows = history.map(slip => [
            slip.id,
            slip.month,
            slip.date,
            slip.basicSalary,
            slip.allowances,
            slip.deductions,
            slip.netSalary,
            slip.status
        ]);

        // Combine
        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "salary_history.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Next Pay Date (1st - 5th of next month)
    const getNextPayDate = () => {
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const monthName = nextMonth.toLocaleDateString('en-US', { month: 'short' });
        return `${monthName} 01 - 05`;
    };

    // Days remaining (until 1st of next month)
    const getDaysRemaining = () => {
        const today = new Date();
        const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const diffTime = nextMonthFirst.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }


    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* --- Header --- */}
                <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 -mt-6 lg:-mt-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="max-w-6xl">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            My Payroll
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            View your salary history, payslips, and tax details.
                        </p>
                    </div>
                </div>

                {/* --- Top Stats Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Salary (Last Month)</span>
                            <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.lastMonthPay)}</h2>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" /> Latest Disbursed
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Deductions (YTD)</span>
                            <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.ytdDeductions)}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                Tax, PF, Insurance (This Year)
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Next Pay Date</span>
                            <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{getNextPayDate()}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                In approx {getDaysRemaining()} days
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* --- Salary History List --- */}
                    <div className="xl:col-span-2 space-y-6">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
                            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Salary History</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:flex hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer dark:text-white"
                                    onClick={exportToCSV}
                                >
                                    Download All (CSV)
                                </Button>
                            </div>
                            <div className="hidden md:block p-0 overflow-x-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                                            <th className="px-3 py-4 font-medium">Month</th>
                                            <th className="px-2 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium hidden md:table-cell">Earnings</th>
                                            <th className="px-6 py-4 font-medium hidden md:table-cell">Deductions</th>
                                            <th className="px-6 py-4 font-medium text-right hidden sm:table-cell">Net Pay</th>
                                            <th className="px-3 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                                                    No payroll records found.
                                                </td>
                                            </tr>
                                        ) : history.map((slip) => (
                                            <tr
                                                key={slip.id}
                                                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedSlip(slip)}
                                            >
                                                <td className="px-3 py-4">
                                                    <div className="font-medium text-slate-900 dark:text-white text-sm">{slip.month}</div>
                                                    <div className="text-[10px] text-slate-500 dark:text-slate-500 hidden sm:block">{slip.date}</div>
                                                </td>
                                                <td className="px-2 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                    capitalize
                                                    ${slip.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' : ''}
                                                    ${slip.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : ''}
                                                    ${slip.status === 'pending' ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-900/30' : ''}
                                                `}
                                                    >
                                                        {slip.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                                                    {formatCurrency(slip.basicSalary + slip.allowances)}
                                                </td>
                                                <td className="px-6 py-4 text-red-500 dark:text-red-400 hidden md:table-cell">
                                                    -{formatCurrency(slip.deductions)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white hidden sm:table-cell">
                                                    {formatCurrency(slip.netSalary)}
                                                </td>
                                                <td className="px-3 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSlip(slip);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 text-slate-500" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- Mobile View: Cards --- */}
                            <div className="md:hidden space-y-4 p-4">
                                {history.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        No payroll records found.
                                    </div>
                                ) : history.map((slip) => (
                                    <div
                                        key={slip.id}
                                        className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 flex flex-col gap-4 cursor-pointer hover:border-blue-500/50 transition-colors"
                                        onClick={() => setSelectedSlip(slip)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white">{slip.month}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{slip.date}</p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`capitalize ${slip.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' : ''} ${slip.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' : ''}`}
                                            >
                                                {slip.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Earnings</p>
                                                <p className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(slip.basicSalary + slip.allowances)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Net Pay</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(slip.netSalary)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* --- Slip Detail View (Side Panel) --- */}
                    <div className="xl:col-span-1">
                        {selectedSlip ? (
                            <Card className="border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 relative overflow-hidden sticky top-24">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payslip Details</h3>
                                            <p className="text-sm text-slate-500">{selectedSlip.month}</p>
                                        </div>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            #{selectedSlip.id}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-lg space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(selectedSlip.basicSalary)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Allowances</span>
                                                <span className="font-medium text-green-600 dark:text-green-400">+{formatCurrency(selectedSlip.allowances)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-400">Deductions</span>
                                                <span className="font-medium text-red-500 dark:text-red-400">-{formatCurrency(selectedSlip.deductions)}</span>
                                            </div>
                                            <Separator className="dark:bg-slate-800" />
                                            <div className="flex justify-between text-base font-bold">
                                                <span className="text-slate-900 dark:text-white">Net Payable</span>
                                                <span className="text-slate-900 dark:text-white ml-auto underline decoration-green-500 decoration-2 underline-offset-4">
                                                    {formatCurrency(selectedSlip.netSalary)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedSlip.status !== 'paid' ? (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Payslip available after payment.
                                        </div>
                                    ) : (
                                        <Button
                                            className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 cursor-pointer shadow-lg shadow-green-500/20"
                                            onClick={() => generatePayslip(selectedSlip)}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Download PDF
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500 sticky top-24">
                                <FileText className="h-10 w-10 mb-3 opacity-50" />
                                <p className="text-sm font-medium">Select a month to view breakdown</p>
                            </div>
                        )}
                    </div>

                </div>
            </div >
        </div >
    );
};

export default Payroll;
