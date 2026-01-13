import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Search, Filter, Mail, Phone, MapPin, X, Edit, Eye, Trash2, AlertTriangle, KeyRound } from "lucide-react";
import { useNotification } from "../../components/NotificationProvider";
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
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Employees: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [employeesList, setEmployeesList] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [departments, setDepartments] = useState<any[]>([]);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/departments/getAll`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setDepartments(data);
                } else {
                    setDepartments([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/emp/all`, {
                method: "GET",
                credentials: "include",
            });

            if (!response.ok) throw new Error("Failed to fetch employees");

            const data = await response.json();

            const mappedEmployees = data.users.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                role: emp.designation,
                systemRole: emp.role, // Add system role from DB
                status: emp.status || "Active",
                email: emp.email,
                phone: emp.phone,
                location: emp.location,
                avatar: emp.avatar_url,
                skills: emp.skills || [],
                employmentType: emp.employment_type,
                joiningDate: emp.joining_date?.split("T")[0] || "",
                salary: emp.salary,
                department_id: emp.department_id,
            }));

            setEmployeesList(mappedEmployees);
        } catch (error) {
            console.error(error);
            showError("Failed to load employees");
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);




    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingEmployee, setViewingEmployee] = useState<any>(null);

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [removingEmployee, setRemovingEmployee] = useState<any>(null);
    const [removalReason, setRemovalReason] = useState("");
    const [adminPassword, setAdminPassword] = useState("");

    const openRemoveModal = (employee: any) => {
        setRemovingEmployee(employee);
        setRemovalReason("");
        setAdminPassword("");
        setIsRemoveModalOpen(true);
    };

    const handleConfirmRemove = async () => {
        if (!adminPassword || !removalReason) {
            showError("Please provide both a reason and your admin password to confirm.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/emp/removeEmp/${removingEmployee.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    reason: removalReason,
                    password: adminPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Failed to remove employee");
            }

            showSuccess(`Employee ${removingEmployee.name} has been removed.`);
            setIsRemoveModalOpen(false);
            fetchEmployees(); // Refresh the list
        } catch (error: any) {
            console.error("Error removing employee:", error);
            showError(error.message || "An error occurred while removing the employee.");
        }
    };

    const countryCodes = ["+1", "+44", "+91", "+61", "+81", "+49", "+33", "+86"];

    const initialFormState = {
        name: "",
        email: "",
        countryCode: "+91",
        phone: "",
        designation: "",
        location: "",
        skills: [] as string[],
        employmentType: "Full Time",
        joiningDate: "",
        salary: 0,
        departmentId: "unassigned",
        systemRole: "employee" // Default role
    };

    const [newEmployee, setNewEmployee] = useState(initialFormState);

    const availableSkills = [
        "React.js", "Node.js", "Next.js", "Postgres", "Docker", "TypeScript",
        "WordPress", "PHP", "SEO", "Content Writing",
        "Photoshop", "Illustrator", "Adobe XD", "Figma", "Video Editing"
    ];

    const toggleSkill = (skill: string) => {
        setNewEmployee(prev => {
            const skills = prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill];
            return { ...prev, skills };
        });
    };

    const handleSaveEmployee = async () => {
        try {
            // Basic validation (optional but recommended)
            if (!newEmployee.name || !newEmployee.email) {
                showError("Name and email are required.");
                return;
            }

            const fullPhone = `${newEmployee.countryCode} ${newEmployee.phone}`.trim();

            const payload: {
                name: string;
                email: string;
                designation: string;
                phone: string;
                location: string;
                salary: number;
                skills: string[];
                joining_date: string;
                employment_type: string;
                department_id: number | null;
                role: string;
            } = {
                name: newEmployee.name,
                email: newEmployee.email,
                designation: newEmployee.designation,
                phone: fullPhone,
                location: newEmployee.location,
                salary: newEmployee.salary,
                skills: newEmployee.skills,
                joining_date: newEmployee.joiningDate,
                employment_type: newEmployee.employmentType,
                department_id: (newEmployee.departmentId && newEmployee.departmentId !== "unassigned") ? parseInt(newEmployee.departmentId) : null,
                role: newEmployee.systemRole // Payload
            };

            const isEdit = Boolean(editingId);

            const url = isEdit
                ? `${API_BASE_URL}/admin/emp/updateEmp/${editingId}`
                : `${API_BASE_URL}/admin/emp/addEmp`;

            const method = isEdit ? "PUT" : "POST";


            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || "Operation failed");
            }

            showSuccess(isEdit ? "Employee updated successfully!" : "Employee added successfully!");

            // Reset UI
            setIsAddModalOpen(false);
            setNewEmployee(initialFormState);
            setEditingId(null);

            // Refresh employee list
            fetchEmployees();

        } catch (error: any) {
            console.error("Error saving employee:", error);
            showError(error?.message || "Failed to save employee. Please try again.");
        }
    };


    const openAddModal = () => {
        setNewEmployee(initialFormState);
        setEditingId(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (employee: any) => {
        // Split phone into code and number
        let code = "+91";
        let number = employee.phone || "";

        for (const c of countryCodes) {
            if (employee.phone && employee.phone.startsWith(c)) {
                code = c;
                number = employee.phone.replace(c, "").trim();
                break;
            }
        }

        setNewEmployee({
            name: employee.name,
            email: employee.email,
            countryCode: code,
            phone: number,
            designation: employee.role,
            location: employee.location,
            skills: employee.skills || [],
            employmentType: employee.employmentType || "Full Time",
            joiningDate: employee.joiningDate || "",
            salary: employee.salary || "",
            departmentId: employee.department_id ? employee.department_id.toString() : "unassigned",
            systemRole: employee.systemRole || "employee"
        });
        setEditingId(employee.id);
        setIsAddModalOpen(true);
    };

    const openViewModal = (employee: any) => {
        setViewingEmployee(employee);
        setIsViewModalOpen(true);
    };

    const filteredEmployees = employeesList.filter((employee) => {
        const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
        const matchesSearch =
            employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            employee.role.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* --- Header --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            Employees
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Manage your team members and their roles.
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg cursor-pointer"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Employee
                    </Button>
                </div>

                {/* --- Filters & Search --- */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex-1 md:flex-none cursor-pointer dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:border-slate-800">
                                    <Filter className="mr-2 h-4 w-4" /> Status: {statusFilter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-800" align="end">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                    <DropdownMenuRadioItem value="All" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">All Statuses</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Active" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">Active</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="On Leave" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">On Leave</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Probation" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">Probation</DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="Inactive" className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800">Inactive</DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* --- Employee Grid --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  gap-6">
                    {filteredEmployees.map((employee) => (
                        <Card key={employee.id} className="group relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md transition-all">



                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16 border-2 border-white dark:border-slate-800 shadow-sm">
                                        <AvatarImage src={employee.avatar} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 text-lg dark:bg-slate-800 dark:text-slate-400">{employee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{employee.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{employee.role}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant="outline" className={`
                                        ${employee.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/10' : ''}
                                        ${employee.status === 'On Leave' ? 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/10' : ''}
                                        ${employee.status === 'Probation' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/10' : ''}
                                     `}>
                                                {employee.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Mail className="h-4 w-4 mr-3 text-slate-400" /> {employee.email}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <Phone className="h-4 w-4 mr-3 text-slate-400" /> {employee.phone}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                                        <MapPin className="h-4 w-4 mr-3 text-slate-400" /> {employee.location}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Action Footer */}
                            <div className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-2">Actions</span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-blue-600 cursor-pointer"
                                        onClick={() => openViewModal(employee)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-blue-600 cursor-pointer"
                                        onClick={() => openEditModal(employee)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800 rounded-full text-slate-500 hover:text-red-600 cursor-pointer"
                                        onClick={() => openRemoveModal(employee)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

            </div>
            {/* --- Add Employee Modal --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? "Edit Employee" : "Add New Employee"}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{editingId ? "Update employee details and information." : "Enter the details of the new team member."}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => setIsAddModalOpen(false)}
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                <Input
                                    placeholder="e.g. John Doe"
                                    value={newEmployee.name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="john@company.com"
                                        value={newEmployee.email}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                    <div className="flex gap-2">
                                        <Select
                                            value={newEmployee.countryCode}
                                            onValueChange={(value) => setNewEmployee({ ...newEmployee, countryCode: value })}
                                        >
                                            <SelectTrigger className="w-[80px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                                <SelectValue placeholder="Code" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[200px]">
                                                {countryCodes.map((code) => (
                                                    <SelectItem key={code} value={code} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                        {code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="tel"
                                            placeholder="1234567890"
                                            value={newEmployee.phone}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                            className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role / Designation</label>
                                    <Input
                                        placeholder="e.g. Senior Frontend Dev"
                                        value={newEmployee.designation}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>



                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employee Address</label>
                                <Input
                                    placeholder="e.g. New York, USA or Remote"
                                    value={newEmployee.location}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                                <Select
                                    value={newEmployee.departmentId}
                                    onValueChange={(value) => setNewEmployee({ ...newEmployee, departmentId: value })}
                                >
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                        <SelectValue placeholder="Select Department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        <SelectItem value="unassigned" className="text-slate-500 dark:text-slate-400 cursor-pointer">Unassigned</SelectItem>
                                        {Array.isArray(departments) && departments.map(dep => (
                                            <SelectItem key={dep.id} value={dep.id.toString()} className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">
                                                {dep.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">System Role (Permissions)</label>
                                <Select
                                    value={newEmployee.systemRole}
                                    onValueChange={(value) => setNewEmployee({ ...newEmployee, systemRole: value })}
                                >
                                    <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                        <SelectItem value="employee" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Employee</SelectItem>
                                        <SelectItem value="manager" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Manager</SelectItem>
                                        <SelectItem value="hr" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">HR</SelectItem>
                                        {/* <SelectItem value="admin" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Admin (Careful)</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Employment Type</label>
                                    <Select
                                        value={newEmployee.employmentType}
                                        onValueChange={(value) => setNewEmployee({ ...newEmployee, employmentType: value })}
                                    >
                                        <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            <SelectItem value="Full Time" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Full Time</SelectItem>
                                            <SelectItem value="Part Time" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Part Time</SelectItem>
                                            <SelectItem value="Contract" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Contract</SelectItem>
                                            <SelectItem value="Intern" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Intern</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Salary (Monthly)</label>
                                    <Input
                                        type='number'
                                        placeholder="e.g. 12000"
                                        value={newEmployee.salary}
                                        onChange={(e) => setNewEmployee({ ...newEmployee, salary: e.target.value === "" ? 0 : Number(e.target.value) })}
                                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Joining Date</label>
                                <Input
                                    type="date"
                                    value={newEmployee.joiningDate}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Skills</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableSkills.map((skill) => (
                                        <Badge
                                            key={skill}
                                            variant={newEmployee.skills.includes(skill) ? "default" : "outline"}
                                            className={`cursor-pointer px-3 py-1 text-sm transition-colors
                                                ${newEmployee.skills.includes(skill)
                                                    ? "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border-dashed"
                                                }
                                            `}
                                            onClick={() => toggleSkill(skill)}
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button
                                variant="outline"
                                onClick={() => setIsAddModalOpen(false)}
                                className="cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveEmployee}
                                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer"
                            >
                                {editingId ? "Save Changes" : "Add Employee"}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- View Employee Modal --- */}
            {
                isViewModalOpen && viewingEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-lg p-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden">

                            {/* Header Banner */}
                            <div className="bg-slate-100 dark:bg-slate-900 h-32 w-full relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full cursor-pointer bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md"
                                    onClick={() => setIsViewModalOpen(false)}
                                >
                                    <X className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                </Button>
                            </div>

                            <div className="px-6 pb-6 -mt-12 relative">
                                {/* Profile Header */}
                                <div className="flex flex-col items-center text-center">
                                    <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-950 shadow-lg mb-4">
                                        <AvatarImage src={viewingEmployee.avatar} />
                                        <AvatarFallback className="text-3xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{viewingEmployee.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingEmployee.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{viewingEmployee.role}</p>
                                    <div className="flex gap-2 mt-3">
                                        <Badge variant="outline" className={`
                                        ${viewingEmployee.status === 'Active' ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/10' : ''}
                                        ${viewingEmployee.status === 'On Leave' ? 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/10' : ''}
                                        ${viewingEmployee.status === 'Probation' ? 'text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/10' : ''}
                                    `}>
                                            {viewingEmployee.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-8">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                                        <div className="flex items-center mt-1 text-slate-700 dark:text-slate-300 font-medium overflow-hidden">
                                            <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                                            <span className="truncate" title={viewingEmployee.email}>{viewingEmployee.email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
                                        <div className="flex items-center mt-1 text-slate-700 dark:text-slate-300 font-medium">
                                            <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" /> {viewingEmployee.phone}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</label>
                                        <div className="flex items-center mt-1 text-slate-700 dark:text-slate-300 font-medium overflow-hidden">
                                            <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 flex-shrink-0" />
                                            <span className="truncate" title={viewingEmployee.location}>{viewingEmployee.location}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</label>
                                        <div className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
                                            {viewingEmployee.employmentType}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Joining Date</label>
                                        <div className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
                                            {viewingEmployee.joiningDate || "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salary</label>
                                        <div className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
                                            {viewingEmployee.salary ? `₹${Number(viewingEmployee.salary).toLocaleString()}` : "N/A"}
                                        </div>
                                    </div>
                                </div>

                                {/* Skills Section */}
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Skills</label>
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

                                <div className="mt-8">
                                    <Button
                                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 cursor-pointer"
                                        onClick={() => { setIsViewModalOpen(false); openEditModal(viewingEmployee); }}
                                    >
                                        <Edit className="w-4 h-4 mr-2" /> Edit Profile
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* --- Remove Confirmation Modal --- */}
            {
                isRemoveModalOpen && removingEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Remove Employee?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    You are about to remove <span className="font-semibold text-slate-900 dark:text-white">{removingEmployee.name}</span>. This action cannot be undone immediately.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Reason for Removal</label>
                                    <Input
                                        placeholder="e.g. Resignation, Termination..."
                                        value={removalReason}
                                        onChange={(e) => setRemovalReason(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <KeyRound className="h-3 w-3" /> Admin Password (2FA)
                                    </label>
                                    <Input
                                        type="password"
                                        placeholder="Enter admin password (use 1234)"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-400">Security check required to proceed.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <Button
                                    variant="outline"
                                    className="flex-1 cursor-pointer dark:text-white dark:border-slate-700"
                                    onClick={() => setIsRemoveModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleConfirmRemove}
                                    disabled={!removalReason || !adminPassword}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default Employees;
