import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Plus, X, Loader2, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useNotification } from "../../components/NotificationProvider";

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const ManageAdmins: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  // const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Admin Data State
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);



  const fetchAdmins = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admins/getAdmins`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();

      const mappedAdmins = data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar_url || "",
      }));

      setAdmins(mappedAdmins);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setCurrentAdminId(data.user.id);
        }
      }
    } catch (e) {
      console.error("Auth check failed", e);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, []);

  // --- Add Admin Form State ---
  // --- Add Admin Form State ---
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // --- Remove Admin State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const pendingAddAdmin = false; // Placeholder if needed or just use logic inside handleAddAdmin

  const handleAddAdmin = async () => {
    // 1. Basic Validation
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showError("Please fill in all required fields.");
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      // setPendingAddAdmin(true); // If you want to use loading state

      const response = await fetch(`${API_BASE_URL}/api/admins/addAdmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Required to send the admin's session cookie
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add admin");
      }

      // 2. Success Actions
      showSuccess("New admin added successfully!");
      setIsAddModalOpen(false);
      fetchAdmins(); // Refresh list

      // 3. Reset Form
      setNewAdmin({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      showError(error.message || "Server error occurred");
    } finally {
      // setPendingAddAdmin(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setAdminToDelete(id);
    setDeletePassword("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminToDelete || !deletePassword) {
      showError("Please enter your current password to confirm.");
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Verify Password
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
        credentials: 'include'
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.message || "Password verification failed");
      }

      // 2. Delete Admin
      const deleteRes = await fetch(`${API_BASE_URL}/api/admins/removeAdmin/${adminToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (deleteRes.ok) {
        showSuccess("Admin removed successfully");
        setAdmins(prev => prev.filter(a => a.id !== adminToDelete));
        setIsDeleteModalOpen(false);
        setAdminToDelete(null);
        setDeletePassword("");
      } else {
        const data = await deleteRes.json();
        throw new Error(data.message || "Failed to remove admin");
      }
    } catch (error: any) {
      showError(error.message || "Server error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="space-y-8">
        <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
              Manage Admins
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
              Control system access and manage administrative roles.
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Admin
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {admins.map((admin) => (
              <Card
                key={admin.id}
                className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 flex flex-col items-center text-center space-y-4 relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Options menu could go here */}
                </div>

                <Avatar className="h-20 w-20 border-4 border-slate-50 dark:border-slate-800 shadow-lg">
                  <AvatarImage src={admin.avatar} />
                  <AvatarFallback className="text-xl bg-slate-100 text-slate-500">
                    {admin.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    {admin.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {admin.email}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center">
                    <Shield className="w-3 h-3 mr-1" /> {admin.role}
                  </span>
                </div>

                <div className="w-full pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-slate-700 cursor-pointer"
                    onClick={() => openDeleteModal(admin.id)}
                    disabled={admin.id === currentAdminId} // Prevent deleting self
                  >
                    <Trash className="w-3 h-3 mr-2" /> Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* --- Delete Confirmation Modal --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Removal</h3>
              <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              To remove this admin, please enter your current account password to confirm. This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your Current Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="cursor-pointer dark:text-white dark:border-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deletePassword}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Confirm Remove
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- Add Admin Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Add New Admin
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Invite a new administrator to the platform.
                </p>
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
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Display Name
                </label>
                <Input
                  placeholder="e.g. Sarah Connor"
                  value={newAdmin.name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, name: e.target.value })
                  }
                  className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="sarah@company.com"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter secure password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
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
                onClick={handleAddAdmin}
                disabled={pendingAddAdmin}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer"
              >
                {pendingAddAdmin ? "Adding..." : "Add Admin"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
