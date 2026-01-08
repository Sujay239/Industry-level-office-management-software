export interface SalarySlip {
  id: string;
  month: string;      // e.g., "October 2023"
  date: string;       // e.g., "2023-10-31"
  basicSalary: number;
  allowances: number; // HRA, Transport, etc.
  deductions: number; // Tax, PF, etc.
  netSalary: number;  // (Basic + Allowances) - Deductions
  status: "paid" | "processing" | "pending";
  downloadUrl?: string; // Link to PDF (mocked for now)
}

// Mock Data for demonstration
export const mockSalaryHistory: SalarySlip[] = [
  {
    id: "slip_001",
    month: "November 2023",
    date: "2023-11-30",
    basicSalary: 2500, // Using generic units (e.g. $)
    allowances: 500,
    deductions: 200,
    netSalary: 2800,
    status: "paid",
  },
  {
    id: "slip_002",
    month: "December 2023",
    date: "2023-12-31",
    basicSalary: 2500,
    allowances: 500,
    deductions: 200,
    netSalary: 2800,
    status: "paid",
  },
  {
    id: "slip_003",
    month: "January 2024",
    date: "2024-01-31",
    basicSalary: 2800, // Raise!
    allowances: 600,
    deductions: 250,
    netSalary: 3150,
    status: "processing",
  }
];
