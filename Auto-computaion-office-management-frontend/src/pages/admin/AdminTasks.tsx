import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Plus,
    Search,
    Calendar,
    Trash2,
    Pencil,
    // MoreHorizontal
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNotification } from "../../components/NotificationProvider";

interface Task {
    id: number;
    title: string;
    project: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'In Progress' | 'Completed';
    due_date: string;
    assigned_to: number;
    assigned_to_name: string;
    assigned_to_avatar: string;
    assigned_to_designation: string;
}

interface Employee {
    id: number;
    name: string;
    avatar_url: string;
    designation: string;
}

const AdminTasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        project: '',
        description: '',
        priority: 'Medium',
        status: 'Pending',
        due_date: '',
        assigned_to: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showSuccess, showError } = useNotification();
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;

    useEffect(() => {
        fetchTasks();
        fetchEmployees();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/all`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/emp/all`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.users || []);
            }
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const handleQuickUpdate = async (id: number, field: 'priority' | 'status', value: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ [field]: value })
            });

            if (res.ok) {
                const updatedTask = await res.json();
                setTasks(tasks.map(t => t.id === id ? updatedTask : t));
                showSuccess(`Task ${field} updated!`);
            } else {
                showError("Failed to update task");
            }
        } catch (error) {
            showError("Failed to update task");
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setFormData({
            title: '',
            project: '',
            description: '',
            priority: 'Medium',
            status: 'Pending',
            due_date: '',
            assigned_to: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setIsEditing(true);
        setCurrentTaskId(task.id);
        // Format date to YYYY-MM-DD for input
        const dateStr = new Date(task.due_date).toISOString().split('T')[0];
        setFormData({
            title: task.title,
            project: task.project || '',
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            due_date: dateStr,
            assigned_to: task.assigned_to.toString()
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.assigned_to || !formData.due_date) {
            showError("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const url = isEditing
                ? `${API_BASE_URL}/admin/tasks/${currentTaskId}`
                : `${API_BASE_URL}/admin/tasks/create`;

            const method = isEditing ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const resultTask = await res.json();

                if (isEditing) {
                    setTasks(tasks.map(t => t.id === currentTaskId ? resultTask : t));
                    showSuccess("Task updated successfully!");
                } else {
                    setTasks([resultTask, ...tasks]);
                    showSuccess("Task assigned successfully!");
                }

                setIsModalOpen(false);
            } else {
                const error = await res.json();
                showError(error.message || "Operation failed");
            }
        } catch (error) {
            showError("Failed to save task");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (id: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/admin/tasks/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== id));
                showSuccess("Task deleted.");
            }
        } catch (error) {
            showError("Failed to delete task");
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'All' || task.status === filter;
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'High': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
            case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
            case 'Low': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Pending': return 'bg-slate-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">

                {/* Header */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden flex items-center gap-3">
                            Task Management
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Assign, track, and manage employee tasks.</p>
                    </div>
                    <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg shadow-blue-600/20 transition-all hover:scale-105">
                        <Plus className="h-4 w-4 mr-2" /> Create Task
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="grid grid-cols-4 gap-2 w-full md:w-auto md:flex">
                        {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer flex justify-center items-center ${filter === f
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-950 transition-all dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Task Table - Desktop View */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="hover:bg-transparent border-slate-200 dark:border-slate-800">
                                <TableHead className="w-[300px] text-slate-900 dark:text-white font-semibold">Employee & Task</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold">Priority</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold">Status</TableHead>
                                <TableHead className="text-slate-900 dark:text-white font-semibold w-[150px]">Due Date</TableHead>
                                <TableHead className="text-right text-slate-900 dark:text-white font-semibold w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredTasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        No tasks found. Create one to get started!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTasks.map((task) => (
                                    <TableRow key={task.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                                                    <AvatarImage src={task.assigned_to_avatar} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">{task.assigned_to_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-white line-clamp-1" title={task.title}>{task.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{task.assigned_to_name}</span>
                                                        {task.project && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                                {task.project}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.priority}
                                                onValueChange={(value) => handleQuickUpdate(task.id, 'priority', value)}
                                            >
                                                <SelectTrigger className={`h-8 w-[100px] text-xs font-medium border-0 ${getPriorityColor(task.priority)} focus:ring-0 focus:ring-offset-0`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <SelectItem value="High" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">High</SelectItem>
                                                    <SelectItem value="Medium" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Medium</SelectItem>
                                                    <SelectItem value="Low" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={task.status}
                                                onValueChange={(value) => handleQuickUpdate(task.id, 'status', value)}
                                            >
                                                <SelectTrigger className={`h-8 w-[120px] text-xs font-medium border-0 ${getStatusColor(task.status)} focus:ring-0 focus:ring-offset-0`}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                                                    <SelectItem value="Pending" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Pending</SelectItem>
                                                    <SelectItem value="In Progress" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">In Progress</SelectItem>
                                                    <SelectItem value="Completed" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-800 cursor-pointer">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span className="text-sm">{new Date(task.due_date).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(task)}
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Task Cards - Mobile View */}
                <div className="md:hidden space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading tasks...</div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            No tasks found. Create one to get started!
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                                            <AvatarImage src={task.assigned_to_avatar} />
                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">{task.assigned_to_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{task.assigned_to_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{task.assigned_to_designation || 'Employee'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditModal(task)}
                                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight mt-1">{task.title}</h3>
                                    {task.project && (
                                        <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                            {task.project}
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{task.description}</p>

                                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className={`px-2.5 py-1 rounded text-xs font-semibold border ${getPriorityColor(task.priority)} flex-shrink-0`}>
                                        {task.priority}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)} flex-shrink-0`}>
                                        {task.status}
                                    </div>
                                    <div className="flex items-center text-xs text-slate-500 ml-auto whitespace-nowrap">
                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create/Edit Task Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {isEditing ? <Pencil className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-blue-600" />}
                                {isEditing ? "Edit Task" : "Assign New Task"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Task Title *</label>
                                    <Input
                                        className="bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                        placeholder="e.g. Update Layout"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Project</label>
                                    <Input
                                        className="bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                        placeholder="e.g. Website Redesign"
                                        value={formData.project}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Detailed Description</label>
                                <textarea
                                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 min-h-[100px]"
                                    placeholder="Describe the task requirements..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Assigned To *</label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                                        value={formData.assigned_to}
                                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                    >
                                        <option value="" className="dark:bg-slate-900">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id} className="dark:bg-slate-900 text-slate-900 dark:text-white">{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Due Date *</label>
                                    <Input
                                        type="date"
                                        className="bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Priority *</label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                    >
                                        <option value="Low" className="dark:bg-slate-900">Low</option>
                                        <option value="Medium" className="dark:bg-slate-900">Medium</option>
                                        <option value="High" className="dark:bg-slate-900">High</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    >
                                        <option value="Pending" className="dark:bg-slate-900">Pending</option>
                                        <option value="In Progress" className="dark:bg-slate-900">In Progress</option>
                                        <option value="Completed" className="dark:bg-slate-900">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className='gap-4'>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="cursor-pointer border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                                {isSubmitting ? "Saving..." : isEditing ? "Update Task" : "Assign Task"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminTasks;
