import React, { useState } from "react";
import {
  User,
  Mail,
  Shield,
  Bell,
  Moon,
  Sun,
  Camera,
  Save,
  Lock,
  Smartphone,
  Globe,
  Briefcase,
  Code,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { useNotification } from "../../components/NotificationProvider";
import { useUser } from "../../components/UserProvider";

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useNotification();
  const { user, updateUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // -- State for Form Fields --
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    designation: user.designation,
    bio: user.bio,
    phone: user.phone,
    location: user.location,
  });

  // Sync local state with global user state if it changes externally
  React.useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      designation: user.designation,
      bio: user.bio,
      phone: user.phone,
      location: user.location,
    });
  }, [user]);

  // -- Password Modal State --
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (e.g., 2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        showError("File size too large. Max 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        try {
          const response = await fetch(`${BASE_URL}/settings/updateProfile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ avatar: base64String })
          });
          const data = await response.json();
          if (response.ok) {
            updateUser({ avatar: base64String });
            showSuccess("Profile picture uploaded successfully!");
          } else {
            showError(data.message || "Failed to upload avatar");
          }
        } catch (error) {
          showError("Network error during upload");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // -- Notification Preferences --
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    mobilePush: false,
    weeklyDigest: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/settings/updateProfile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok) {
        updateUser(formData);
        showSuccess("Profile updated successfully!");
      } else {
        showError(data.message || "Failed to update profile");
      }
    } catch (error) {
      showError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  async function handleUpdatePassword(): Promise<void> {
    if (passwordForm.new !== passwordForm.confirm) {
      showError("New password and confirm password do not match!");
      return;
    }
    setIsLoading(true);
    const response = await fetch(`${BASE_URL}/settings/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ oldPassword: passwordForm.current, newPassword: passwordForm.new }),
    });
    const data = await response.json();
    if (!response.ok) {
      showError(data.message);
      setIsLoading(false);
      setShowPasswordModal(false);
      setPasswordForm({
        current: "",
        new: "",
        confirm: "",
      });
      return;
    }

    setIsLoading(false);
    showSuccess("Password updated successfully!");
    setShowPasswordModal(false);
    setPasswordForm({
      current: "",
      new: "",
      confirm: "",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* --- Header --- */}
        {/* --- Header --- */}
        <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 -mt-6 lg:-mt-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white max-sm:hidden">
                Settings
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage your profile, preferences, and account security.
              </p>
            </div>
            <div className="flex items-center gap-3">

              <Button onClick={handleSave} className="bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white transition-all shadow-lg shadow-slate-900/20 dark:shadow-green-900/20 cursor-pointer dark:text-white">
                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* --- LEFT COLUMN (Navigation / Quick Stats could go here, but using full width sections for now) --- */}
          {/* For this layout, we'll use a 12-column grid where the main profile card takes full width or a split */}

          {/* --- PROFILE SECTION --- */}
          <div className="md:col-span-8 space-y-8">
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row items-start gap-6">

                {/* Avatar Column */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="w-28 h-28 border-4 border-white dark:border-slate-800 shadow-xl">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white h-8 w-8" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Avatar
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>

                {/* Form Fields */}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile Information</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Update your public profile details.</p>
                  </div>
                  <Separator className="dark:bg-slate-800" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                        <span className="text-[10px] items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 font-medium">Read Only</span>
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          name="email"
                          value={formData.email}
                          readOnly
                          className="pl-9 bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-dashed focus-visible:ring-0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Job Title / Designation</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
                    <Input
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 h-20 text-wrap py-2 align-top text-slate-900 dark:text-white"
                    //   as="textarea" // If your Input component supports 'as', otherwise use <textarea> with styles
                    />
                  </div>



                  {/* Skills Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-slate-400" />
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Skills</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "React.js", "Node.js", "Next.js",
                        "Postgres", "Docker", "n8n"
                      ].map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-default border border-slate-200 dark:border-slate-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </Card>

            {/* --- NOTIFICATIONS CARD --- */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Choose what updates you want to receive.</p>
                </div>
              </div>
              <Separator className="mb-4 dark:bg-slate-800" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'emailUpdates', label: 'Email Updates', desc: 'Receive daily digests and updates.' },
                  { key: 'securityAlerts', label: 'Security Alerts', desc: 'Get notified of suspicious activity.' },
                  { key: 'mobilePush', label: 'Mobile Push', desc: 'Receive notifications on your phone.' },
                  { key: 'weeklyDigest', label: 'Weekly Report', desc: 'Summary of your weekly activity.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <Checkbox
                      id={item.key}
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={() => handleCheckboxChange(item.key as keyof typeof notifications)}
                      className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-slate-400"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={item.key}
                        className="text-sm font-medium text-slate-900 dark:text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {item.label}
                      </label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* --- RIGHT COLUMN (Appearance & Security) --- */}
          <div className="md:col-span-4 space-y-6">

            {/* Appearance */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg">
                  {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Customize your view.</p>
                </div>
              </div>
              <Separator className="mb-4 dark:bg-slate-800" />

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
                <div
                  onClick={toggleTheme}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out flex items-center ${theme === 'dark' ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </Card>

            {/* Security */}
            <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Protect your account.</p>
                </div>
              </div>
              <Separator className="mb-4 dark:bg-slate-800" />

              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
                className="w-full justify-start text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Lock className="mr-2 h-4 w-4" /> Change Password
              </Button>
              <div className="text-xs text-slate-400 dark:text-slate-500 px-1">
                * Contact your administrator to delete your account.
              </div>

            </Card>

          </div>
        </div>

        {/* --- Password Change Modal --- */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in zoom-in-95 duration-200">

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Password</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ current: "", new: "", confirm: "" });
                  }}
                >
                  <X className="h-4 w-4 text-slate-500" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ current: "", new: "", confirm: "" });
                  }}
                  className="cursor-pointer border-slate-200 dark:border-slate-800 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdatePassword}
                  className="bg-slate-900 dark:bg-green-600 hover:bg-slate-800 dark:hover:bg-green-700 text-white cursor-pointer dark:text-white"
                >
                  Update Password
                </Button>
              </div>
            </Card>
          </div>
        )}


      </div>
    </div>
  );
};

export default Settings;
