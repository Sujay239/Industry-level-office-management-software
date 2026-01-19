import React, { useState, useEffect, type ChangeEvent } from "react";
import { useNotification } from "../../components/NotificationProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  // Plus,
  MoreHorizontal,
  Search,
  Filter,
  AlertCircle,
  // X,
  Trash2,
  Check,
  RotateCw,
  AlertTriangle,
  XCircle,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// --- Types ---
type TaskStatus = "In Progress" | "Pending" | "Completed";
type TaskPriority = "High" | "Medium" | "Low";

type Task = {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

// --- Mock Data Removed ---

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { showSuccess, showError } = useNotification();
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  // --- Fetch Tasks ---
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employee/tasks/all`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();

      // Map backend fields to frontend types
      const mappedTasks = data.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        project: t.project_name || "General",
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
      }));
      setTasks(mappedTasks);
    } catch (error) {
      console.error(error);
      showError("Failed to load tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // --- Filter States ---
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  // Modal States
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);


  // --- Stats Calculations ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;

  // --- Actions ---
  const handleDeleteTask = async (_taskId: string) => {
    // NOTE: User requested specific endpoints for updates but didn't specify Delete.
    // Assuming handled by admin or future implementation. For now, client-side only or disable?
    // Keeping client-side delete visually as placeholder or remove strictly?
    // I'll keep it as local state update for now but usually users can't delete assigned tasks.
    // Re-reading user request: only asked for status updates.
    // I will leave delete as is (local) or comment it out if not needed.
    // Actually, standard is employees can't delete tasks. I will just keep local state for now to avoid errors,
    // or effectively do nothing but show error "Permission denied" if they try.
    // But let's stick to the REQUEST specifically: "put datas from endpoint... and onclick status hit endpoint..."

    showError("Employees cannot delete tasks.");
    setTaskToDelete(null);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      handleDeleteTask(taskToDelete);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Task["status"]) => {
    try {
      let url = "";
      if (newStatus === "In Progress") {
        url = `${API_BASE_URL}/employee/tasks/update/processing/${id}`;
      } else if (newStatus === "Completed") {
        url = `${API_BASE_URL}/employee/tasks/update/completed/${id}`;
      } else {
        return; // No endpoint for reverting to Pending specified
      }

      const response = await fetch(url, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) throw new Error("Failed to update task status");

      showSuccess(`Task marked as ${newStatus}`);
      fetchTasks(); // Refresh list
    } catch (error) {
      console.error(error);
      showError("Failed to update status");
    }
  };


  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchTerm("");
  };

  // --- Filtering Logic ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const isFilterActive = statusFilter !== "all" || priorityFilter !== "all";

  // --- Styles ---
  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high": return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800";
      case "medium": return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "low": return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "in progress": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "pending": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed": return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case "in progress": return <Clock className="w-3.5 h-3.5 mr-1" />;
      case "pending": return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
      default: return null;
    }
  };

  // --- Reusable Actions Menu (Used in both Table and Card view) ---
  const ActionMenu = ({ task }: { task: Task }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
        <DropdownMenuLabel className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Update Status</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'Completed')} className="dark:text-slate-200 dark:focus:bg-slate-900 cursor-pointer">
          <Check className="mr-2 h-4 w-4 text-green-500" /> Complete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'In Progress')} className="dark:text-slate-200 dark:focus:bg-slate-900 cursor-pointer">
          <RotateCw className="mr-2 h-4 w-4 text-amber-500" /> In Progress
        </DropdownMenuItem>
        <DropdownMenuSeparator className="dark:bg-slate-800" />
        <DropdownMenuItem onClick={() => setTaskToDelete(task.id)} className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="space-y-8">

        <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
              Task Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Track your team's progress and manage assignments.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total"
            value={totalTasks}
            icon={<ListTodo className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            bgClass="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatsCard
            title="Active"
            value={inProgressTasks}
            icon={<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            bgClass="bg-amber-50 dark:bg-amber-900/20"
          />
          <StatsCard
            title="Pending"
            value={pendingTasks}
            icon={<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            bgClass="bg-red-50 dark:bg-red-900/20"
          />
          <StatsCard
            title="Done"
            value={completedTasks}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
            bgClass="bg-green-50 dark:bg-green-900/20"
          />
        </div>

        {/* Main Content Area */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
          {/* Toolbar */}
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus-visible:ring-green-500 text-slate-900 dark:text-white"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Clear Filter Badge */}
              {isFilterActive && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-9 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <XCircle size={14} className="mr-1" /> Clear
                </Button>
              )}

              {/* Functional Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-10 border-dashed w-full md:w-auto ${isFilterActive ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
                  >
                    <Filter size={16} className="mr-2" /> Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                >
                  <DropdownMenuLabel className="dark:text-slate-200">Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "all"}
                    onCheckedChange={() => setStatusFilter("all")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    All Statuses
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "In Progress"}
                    onCheckedChange={() => setStatusFilter("In Progress")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    In Progress
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Pending"}
                    onCheckedChange={() => setStatusFilter("Pending")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    Pending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Completed"}
                    onCheckedChange={() => setStatusFilter("Completed")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    Completed
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuLabel className="dark:text-slate-200">Filter by Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter === "all"}
                    onCheckedChange={() => setPriorityFilter("all")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    All Priorities
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter === "High"}
                    onCheckedChange={() => setPriorityFilter("High")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    High
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter === "Medium"}
                    onCheckedChange={() => setPriorityFilter("Medium")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    Medium
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={priorityFilter === "Low"}
                    onCheckedChange={() => setPriorityFilter("Low")}
                    className="cursor-pointer dark:text-slate-300 dark:focus:bg-slate-800"
                  >
                    Low
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* === RESPONSIVE VIEW TOGGLING ===
            1. Desktop View: <Table> (hidden on small screens)
            2. Mobile View: <div className="grid"> (hidden on medium+ screens)
        */}

          {/* --- DESKTOP TABLE VIEW (md:block) --- */}
          <div className="hidden md:block relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="w-[100px] font-semibold text-slate-700 dark:text-slate-300">ID</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Task Details</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Priority</TableHead>
                  <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id} className="group border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-slate-500 dark:text-slate-500">
                        Task-{task.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col py-1">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            {task.title}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            {task.project}
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className={
                              new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""
                            }>
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-medium border ${getPriorityStyle(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className={`pl-1.5 border ${getStatusStyle(task.status)}`}
                          >
                            {getStatusIcon(task.status)}
                            {task.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionMenu task={task} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500 dark:text-slate-400">
                      No tasks found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- MOBILE CARD VIEW (md:hidden) --- */}
          <div className="md:hidden p-4 grid grid-cols-1 gap-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative flex flex-col gap-3">
                  {/* Header: ID + Actions */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {task.id}
                    </span>
                    <div className="-mt-1 -mr-2">
                      <ActionMenu task={task} />
                    </div>
                  </div>

                  {/* Title & Project */}
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg leading-tight">
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {task.project}
                    </p>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className={`font-medium border ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`pl-1.5 border ${getStatusStyle(task.status)}`}
                    >
                      {getStatusIcon(task.status)}
                      {task.status}
                    </Badge>
                  </div>

                  {/* Footer: Date */}
                  <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 mr-2" />
                    <span className={new Date(task.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                      Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <p>No tasks found.</p>
              </div>
            )}
          </div>

        </Card>



        {/* --- Delete Confirmation Modal --- */}
        {taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Task?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Are you sure you want to delete this task? This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                    onClick={() => setTaskToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer"
                    onClick={confirmDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- Helper Component for Stats Cards ---
const StatsCard = ({ title, value, icon, bgClass }: { title: string, value: number, icon: React.ReactNode, bgClass: string }) => (
  <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-950">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</div>
      </div>
      <div className={`p-3 rounded-xl ${bgClass}`}>
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default Tasks;
