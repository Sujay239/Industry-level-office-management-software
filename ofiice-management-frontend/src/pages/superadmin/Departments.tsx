import React, { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Trash2,
    Users,
    X,
    Edit,
    Eye,
    Mail,
    Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define Department type
type Department = {
    id: number;
    name: string;
    description: string;
    manager_id: number | null;
    manager_name: string | null;
    staff_count: number;
    created_at: string;
    staff?: Staff[]; // Optional staff list
};

type Staff = {
    id: number;
    name: string;
    email: string;
    designation: string;
    avatar_url: string;
    phone: string;
};

// Define User type for manager selection
type User = {
    id: number;
    name: string;
    email: string;
    role: string;
};

const Departments: React.FC = () => {
    const API_BASE_URL = import.meta.env.VITE_BASE_URL;
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentDep, setCurrentDep] = useState<Partial<Department>>({});

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingDep, setViewingDep] = useState<Department | null>(null);
    const [_loadingView, setLoadingView] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [managerId, setManagerId] = useState<string>("");

    // Managers list
    const [managers, setManagers] = useState<User[]>([]);

    useEffect(() => {
        fetchDepartments();
        fetchPotentialManagers();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/departments/getAll`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setDepartments(data);
            }
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPotentialManagers = async () => {
        try {
            // Reusing getAdmins for now, or we could add a route to get all eligible managers (admins + managers)
            // For now, let's just get admins. Ideally we should have a route /admin/emp/getAllManagers
            const res = await fetch(`${API_BASE_URL}/superadmin/departments/getPotentialManagers`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setManagers(data);
            }
        } catch (error) {
            console.error("Failed to fetch managers", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = modalMode === 'add'
                ? `${API_BASE_URL}/superadmin/departments/add`
                : `${API_BASE_URL}/superadmin/departments/update/${currentDep.id}`;

            const method = modalMode === 'add' ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    manager_id: managerId ? parseInt(managerId) : null
                }),
                credentials: "include"
            });

            if (res.ok) {
                fetchDepartments();
                setIsModalOpen(false);
                resetForm();
            } else {
                const err = await res.json();
                alert(err.message || "Operation failed");
            }
        } catch (error) {
            console.error("Error submitting form", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure? Users in this department will optionally be unassigned.")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/departments/delete/${id}`, {
                method: 'DELETE',
                credentials: "include"
            });

            if (res.ok) {
                setDepartments(prev => prev.filter(d => d.id !== id));
            } else {
                alert("Failed to delete department");
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    };


    const fetchDepartmentDetails = async (id: number) => {
        setLoadingView(true);
        try {
            const res = await fetch(`${API_BASE_URL}/superadmin/departments/get/${id}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setViewingDep(data);
                setIsViewModalOpen(true);
            } else {
                alert("Failed to fetch department details");
            }
        } catch (error) {
            console.error("Error fetching details", error);
        } finally {
            setLoadingView(false);
        }
    };

    const openEditModal = (dep: Department) => {
        setModalMode('edit');
        setCurrentDep(dep);
        setName(dep.name);
        setDescription(dep.description || "");
        setManagerId(dep.manager_id ? dep.manager_id.toString() : "");
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setManagerId("");
        setCurrentDep({});
        setModalMode('add');
    };

    const filteredDepartments = departments.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.manager_name && d.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-6">
                {/* Header */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                            Departments
                        </h1>
                        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                            Manage company departments and their heads.
                        </p>
                    </div>
                    <Button
                        onClick={() => { resetForm(); setModalMode('add'); setIsModalOpen(true); }}
                        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Department
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:text-white"
                    />
                </div>

                {/* Grid/List */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading departments...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredDepartments.map((dep) => (
                            <div key={dep.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Users size={24} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => fetchDepartmentDetails(dep.id)}
                                            className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors cursor-pointer"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(dep)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dep.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{dep.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                    {dep.description || "No description provided"}
                                </p>

                                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Manager:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {dep.manager_name || "Unassigned"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Staff Count:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {dep.staff_count} Members
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {modalMode === 'add' ? 'Add Department' : 'Edit Department'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Department Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Manager (Optional)
                                    </label>
                                    <select
                                        value={managerId}
                                        onChange={(e) => setManagerId(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                    >
                                        <option value="">Select Manager</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        {modalMode === 'add' ? 'Create' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Modal */}
                {
                    isViewModalOpen && viewingDep && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            {viewingDep.name}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Department Details</p>
                                    </div>
                                    <button onClick={() => setIsViewModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-8">
                                    {/* Details Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {viewingDep.description || "No description"}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Manager</label>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {viewingDep.manager_name || "Unassigned"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Staff List Section */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                            Staff Members ({viewingDep.staff?.length || 0})
                                        </h3>

                                        {viewingDep.staff && viewingDep.staff.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-4">
                                                {viewingDep.staff.map((staff) => (
                                                    <div key={staff.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                                {staff.avatar_url ? (
                                                                    <img src={staff.avatar_url} alt={staff.name} className="h-full w-full rounded-full object-cover" />
                                                                ) : (
                                                                    staff.name.charAt(0)
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                                    {staff.name}
                                                                    {viewingDep.manager_id === staff.id && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                                            Manager
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">{staff.designation || "No Role"}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                                                <Mail size={12} className="mr-1" /> {staff.email}
                                                            </div>
                                                            {staff.phone && (
                                                                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                                                    <Phone size={12} className="mr-1" /> {staff.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                                <p className="text-slate-500">No staff members assigned to this department.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div>
    );
};

export default Departments;
