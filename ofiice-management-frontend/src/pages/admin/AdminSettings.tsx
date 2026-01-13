import React, { useState, useEffect, useRef } from "react";
import {
    Camera,
    // LayoutDashboard,
    Loader2,
    Lock,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/use-theme";
import { useNotification } from "../../components/NotificationProvider";
import { OtpInput } from "@/components/ui/otp-input";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    designation: string | null;
    phone: string | null;
    location: string | null;
    avatar_url: string | null;
    two_factor_enabled: boolean;
}

const AdminSettings: React.FC = () => {
    useTheme();
    const { showSuccess, showError } = useNotification();
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<UserData | null>(null);

    // -- Form State --
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
        designation: "",
        phone: "",
        location: "",
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // -- Change Password State --
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [changePassData, setChangePassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    });

    // -- 2FA State --
    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [twoFactorPin, setTwoFactorPin] = useState("");
    const [isEnabling2FA, setIsEnabling2FA] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/myData`, { credentials: 'include' });
                if (!response.ok) throw new Error("Failed to fetch user data");
                const data = await response.json();
                setUserData(data.user);
                setFormData({
                    name: data.user.name || "",
                    email: data.user.email || "",
                    role: data.user.role || "",
                    designation: data.user.designation || "",
                    phone: data.user.phone || "",
                    location: data.user.location || "",
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                showError("Failed to load user data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name || !formData.email) {
            showError("Name and Email are required.");
            return;
        }
        setIsPasswordModalOpen(true);
    };

    const confirmSave = async () => {
        if (!passwordConfirm) {
            showError("Password is required to save changes.");
            return;
        }

        setIsLoading(true);
        setIsPasswordModalOpen(false);

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("designation", formData.designation || "");
            data.append("phone", formData.phone || "");
            data.append("location", formData.location || "");
            data.append("password", passwordConfirm);

            if (selectedFile) {
                data.append("avatar", selectedFile);
            }

            const response = await fetch(`${API_BASE_URL}/admin/settings/updateAdmin`, {
                method: "POST",
                credentials: "include",
                body: data,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to update settings");
            }

            showSuccess("Settings updated successfully!");
            if (userData && result.user) {
                setUserData({ ...userData, ...result.user });
                setFormData(prev => ({
                    ...prev,
                    name: result.user.name || prev.name,
                    designation: result.user.designation || prev.designation,
                    phone: result.user.phone || prev.phone,
                    location: result.user.location || prev.location
                }));

            }
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to save settings");
        } finally {
            setIsLoading(false);
            setPasswordConfirm("");
        }
    };

    const handleChangePasswordSubmit = async () => {
        const { currentPassword, newPassword, confirmNewPassword } = changePassData;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showError("All fields are required.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showError("New passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            showError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/admin/settings/changePassword`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to change password");
            }

            showSuccess("Password changed successfully!");
            setIsChangePasswordOpen(false);
            setChangePassData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });

        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to change password");
        } finally {
            setIsLoading(false);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handle2FAToggle = (checked: boolean) => {
        setIsEnabling2FA(checked);
        setIs2FAModalOpen(true);
    };

    const handle2FASubmit = async () => {
        if (!twoFactorPin || twoFactorPin.length < 4 || twoFactorPin.length > 6) {
            showError("PIN must be between 4 and 6 digits.");
            return;
        }

        setIsLoading(true);
        try {
            const endpoint = isEnabling2FA
                ? `${API_BASE_URL}/admin/settings/enable-2fa`
                : `${API_BASE_URL}/admin/settings/disable-2fa`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ pin: twoFactorPin }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to update 2FA settings");
            }

            showSuccess(result.message || (isEnabling2FA ? "2FA Enabled" : "2FA Disabled"));

            if (isEnabling2FA) {
                // Do NOT mark as verified. User wants to be asked again.
                // Reload and go to dashboard -> Guard will catch enabled 2FA & unverified session -> Redirect to Verify2FA
                window.location.href = '/';
                return;
            } else {
                // Clear 2FA session if disabled
                sessionStorage.removeItem('is2FAVerified');
            }

            // Update local state
            if (userData) {
                setUserData({ ...userData, two_factor_enabled: isEnabling2FA });
            }

            setIs2FAModalOpen(false);
            setTwoFactorPin("");
        } catch (error: any) {
            console.error(error);
            showError(error.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !userData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* --- Main Header --- */}
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Manage your account settings and preferences.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[400px] mb-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 flex justify-between items-center">
                        <TabsTrigger value="general" className="text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">General</TabsTrigger>
                        <TabsTrigger value="security" className="text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">Security</TabsTrigger>
                        <TabsTrigger value="notifications" className="text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm mr-2">Notifs</TabsTrigger>
                    </TabsList>

                    {/* --- GENERAL TAB --- */}
                    <TabsContent value="general" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="grid gap-6">
                            <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                                <CardHeader>
                                    <CardTitle className="dark:text-white">Profile Information</CardTitle>
                                    <CardDescription className="dark:text-slate-400">Update your photo and personal details here.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    {/* Avatar Row */}
                                    <div className="flex items-center gap-6">
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Avatar className="w-20 h-20 border border-slate-200 dark:border-slate-700">
                                                <AvatarImage src={
                                                    previewUrl || (userData?.avatar_url
                                                        ? (userData.avatar_url.startsWith('data:') || userData.avatar_url.startsWith('http')
                                                            ? userData.avatar_url
                                                            : `${API_BASE_URL}/uploads/${userData.avatar_url}`)
                                                        : "")
                                                } />
                                                <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">{userData?.name?.charAt(0) || "U"}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white h-6 w-6" />
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">Profile Photo</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Click to upload a new avatar.</p>
                                        </div>
                                    </div>

                                    <Separator className="dark:bg-slate-800" />

                                    {/* Form Grid */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                                            <Input name="name" value={formData.name} onChange={handleInputChange} className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800" />
                                        </div>
                                        <div className="space-y-2 ">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email (Read Only)</label>
                                            <Input value={formData.email} readOnly className="cursor-not-allowed bg-slate-50 dark:bg-slate-900/50 border-dashed dark:border-slate-800 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title / Designation</label>
                                            <Input name="designation" value={formData.designation} onChange={handleInputChange} className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800" placeholder="e.g. Senior Manager" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                            <Input name="role" value={formData.role} readOnly className="cursor-not-allowed bg-slate-50 dark:bg-slate-900/50 border-dashed dark:border-slate-800 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                            <Input name="phone" value={formData.phone} onChange={handleInputChange} className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                                            <Input name="location" value={formData.location} onChange={handleInputChange} className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSave} disabled={isLoading} className="bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white">
                                            {isLoading ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- SECURITY TAB --- */}
                    <TabsContent value="security" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                            <CardHeader>
                                <CardTitle className="dark:text-white">Security Settings</CardTitle>
                                <CardDescription className="dark:text-slate-400">Manage your password and account security preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">Password</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Changed 3 months ago</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-9 text-sm dark:bg-slate-800 dark:text-white dark:border-slate-700 cursor-pointer"
                                        onClick={() => setIsChangePasswordOpen(true)}
                                    >
                                        Change Password
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                                    </div>
                                    <Switch
                                        checked={userData?.two_factor_enabled || false}
                                        onCheckedChange={handle2FAToggle}
                                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700 cursor-pointer"
                                    />

                                </div>



                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- NOTIFICATIONS TAB --- */}
                    <TabsContent value="notifications" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                            <CardHeader>
                                <CardTitle className="dark:text-white">Notifications</CardTitle>
                                <CardDescription className="dark:text-slate-400">Configure how you receive alerts.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Email Notifications</h4>
                                    {[
                                        { label: "Daily Digest", desc: "Get a summary of daily activities." },
                                        { label: "New Employee Signups", desc: "When a new employee joins the platform." },
                                        { label: "Leave Requests", desc: "When an employee applies for leave." },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start space-x-3">
                                            <Checkbox
                                                id={`notif-${i}`}
                                                defaultChecked
                                                className="mt-1 border-slate-400 dark:border-slate-100 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 dark:data-[state=checked]:bg-slate-100 dark:data-[state=checked]:border-slate-100 dark:data-[state=checked]:text-slate-900 data-[state=checked]:text-white"
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor={`notif-${i}`} className="text-sm font-medium text-slate-900 dark:text-white leading-none cursor-pointer">
                                                    {item.label}
                                                </label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* <Separator className="dark:bg-slate-800" /> */}
                                {/* <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Push Notifications</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Enable Push Notifications</span>
                                        <Switch />
                                    </div>
                                </div> */}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- APPEARANCE TAB --- */}

                </Tabs>

                {/* --- Password Confirmation Modal --- */}
                {isPasswordModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-center w-full">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mx-auto flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authorize Changes</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Please enter your password to confirm these changes.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsPasswordModalOpen(false)}>
                                    <X className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white">Cancel</Button>
                                <Button onClick={confirmSave} className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer">Confirm & Save</Button>
                            </div>
                        </Card>
                    </div>
                )}

                {isChangePasswordOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-center w-full">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Enter your current password and a new strong password.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setIsChangePasswordOpen(false)}>
                                    <X className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                                    <Input
                                        type="password"
                                        placeholder="Current Password"
                                        value={changePassData.currentPassword}
                                        onChange={(e) => setChangePassData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                    <Input
                                        type="password"
                                        placeholder="New Password"
                                        value={changePassData.newPassword}
                                        onChange={(e) => setChangePassData(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={changePassData.confirmNewPassword}
                                        onChange={(e) => setChangePassData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                                        className="text-slate-900 dark:text-white dark:bg-slate-900 dark:border-slate-800"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)} className="flex-1 cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white">Cancel</Button>
                                <Button onClick={handleChangePasswordSubmit} disabled={isLoading} className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 cursor-pointer">
                                    {isLoading ? "Updating..." : "Update Password"}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* --- 2FA Modal --- */}
                {is2FAModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-center w-full">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {isEnabling2FA ? "Enable Two-Factor Auth" : "Disable Two-Factor Auth"}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        {isEnabling2FA
                                            ? "Please set a 4-6 digit PIN to enable 2FA."
                                            : "Please enter your current PIN to disable 2FA."}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { setIs2FAModalOpen(false); setTwoFactorPin(""); }}>
                                    <X className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <OtpInput
                                        value={twoFactorPin}
                                        onChange={setTwoFactorPin}
                                        length={6}
                                        onComplete={() => { /* Optional: auto-submit? */ }}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={() => { setIs2FAModalOpen(false); setTwoFactorPin(""); }} className="flex-1 cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white">Cancel</Button>
                                <Button onClick={handle2FASubmit} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                                    {isLoading ? "Processing..." : (isEnabling2FA ? "Enable 2FA" : "Disable 2FA")}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminSettings;
