import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Link as LinkIcon,
  Users,
  Trash2,
  ExternalLink,
  Plus,
  Eye,
  Pencil,
} from "lucide-react";
import { useNotification } from "../../components/NotificationProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";

// For Multi-select
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  department_name?: string;
  designation?: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  join_url: string;
  user_id: number[];
}

const AdminMeetings: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // View Modal State
  const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Edit Modal State
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/meetings/all`, {
        credentials: "include", // Important for cookies
      });
      if (!response.ok) throw new Error("Failed to fetch meetings");
      const data = await response.json();
      setMeetings(data.meetings);
    } catch (error) {
      console.error(error);
      showError("Failed to load meetings");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/emp/all/meetings`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  // Reset form when opening create/edit
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setJoinUrl("");
    setSelectedUserIds([]);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setEditMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description);
    // Format datetime-local string (YYYY-MM-DDTHH:MM)
    setStartTime(new Date(meeting.start_time).toISOString().slice(0, 16));
    setEndTime(new Date(meeting.end_time).toISOString().slice(0, 16));
    setJoinUrl(meeting.join_url);
    setSelectedUserIds(meeting.user_id || []);
    setIsEditModalOpen(true);
  };

  const openViewModal = (meeting: Meeting) => {
    setViewMeeting(meeting);
    setIsViewModalOpen(true);
  };

  const handleCreateMeeting = async () => {
    if (!title || !startTime || !endTime) {
      showError("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/meetings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          join_url: joinUrl,
          user_ids: selectedUserIds,
        }),
      });

      if (!response.ok) throw new Error("Failed to create meeting");

      showSuccess("Meeting scheduled successfully");
      setIsCreateModalOpen(false);
      resetForm();
      fetchMeetings();
    } catch (error) {
      console.error(error);
      showError("Failed to schedule meeting");
    }
  };

  const handleUpdateMeeting = async () => {
    if (!editMeeting || !title || !startTime || !endTime) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/meetings/${editMeeting.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            description,
            start_time: startTime,
            end_time: endTime,
            join_url: joinUrl,
            user_ids: selectedUserIds,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update meeting");

      showSuccess("Meeting updated successfully");
      setIsEditModalOpen(false);
      setEditMeeting(null);
      resetForm();
      fetchMeetings();
    } catch (error) {
      console.error(error);
      showError("Failed to update meeting");
    }
  };

  const confirmDeleteMeeting = async () => {
    if (!deleteId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/meetings/${deleteId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to cancel meeting");

      showSuccess("Meeting cancelled");
      fetchMeetings();
      setIsDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      showError("Failed to cancel meeting");
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // Filter Meetings
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(todayStart);
  startOfTomorrow.setDate(todayStart.getDate() + 1);

  // Helper: Parse ISO string components as LOCAL time (ignoring 'Z' or offset)
  // "2026-01-11T16:25:00.000Z" -> Date(2026, 0, 11, 16, 25, 0) in browser local time
  const parseLocal = (isoStr: string) => {
    if (!isoStr) return new Date();
    // Remove Z and anything after, act like it's local ISO
    const cleanStr = isoStr.replace("Z", "").split("+")[0];
    return new Date(cleanStr);
  };

  // Helpers to compare dates (ignoring time)
  const isSameDate = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // Past: End time is over OR Start Date is before today
  const pastMeetings = meetings.filter((m) => {
    const mStart = parseLocal(m.start_time);
    const mEnd = parseLocal(m.end_time);

    // Check if start date is strictly before today (ignoring time)
    const isBeforeToday = mStart < todayStart;

    return isBeforeToday || mEnd < now;
  });

  // Today: Start Date is Today AND End Time is NOT over
  const todayMeetings = meetings.filter((m) => {
    const mStart = parseLocal(m.start_time);
    const mEnd = parseLocal(m.end_time);

    return isSameDate(mStart, todayStart) && mEnd >= now;
  });

  // Upcoming: Start Date is After today
  const futureMeetings = meetings.filter((m) => {
    const mStart = parseLocal(m.start_time);
    return mStart >= startOfTomorrow;
  });

  const renderMeetingList = (list: Meeting[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center text-slate-500 py-10">
          No meetings found.
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((meeting) => {
          const mStart = parseLocal(meeting.start_time);
          const mEnd = parseLocal(meeting.end_time);
          // Same logic as pastMeetings filter: strictly started before today OR end time is past
          const isMeetingPast = mStart < todayStart || mEnd < now;

          return (
            <Card
              key={meeting.id}
              className="relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md transition-all"
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full ${parseLocal(meeting.start_time) > now
                  ? "bg-blue-500"
                  : "bg-slate-300"
                  }`}
              ></div>
              <CardHeader className="pb-2 pl-6">
                <div className="flex justify-between items-start">
                  <CardTitle
                    className="text-lg font-bold text-slate-900 dark:text-white truncate pr-20"
                    title={meeting.title}
                  >
                    {meeting.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 absolute right-2 top-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                      onClick={() => openViewModal(meeting)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${isMeetingPast
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                        }`}
                      onClick={() => !isMeetingPast && openEditModal(meeting)}
                      title={
                        isMeetingPast ? "Cannot edit past meeting" : "Edit"
                      }
                      disabled={isMeetingPast}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                      onClick={() => openDeleteModal(meeting.id)}
                      title="Cancel Meeting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {parseLocal(meeting.start_time).toLocaleDateString("en-GB")}
                </div>
              </CardHeader>
              <CardContent className="pl-6 pt-0 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center text-sm font-medium text-slate-700 dark:text-white">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    {meeting.start_time.substring(11, 16)} -{" "}
                    {meeting.end_time.substring(11, 16)}
                  </div>
                  {meeting.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}
                </div>

                {meeting.user_id && meeting.user_id.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {meeting.user_id.length} Participants
                    </span>
                  </div>
                )}

                {meeting.join_url && (
                  <div className="pt-2">
                    <Button
                      className={`w-full gap-2 ${isMeetingPast
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500"
                        : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        }`}
                      onClick={() =>
                        !isMeetingPast &&
                        window.open(meeting.join_url, "_blank")
                      }
                      disabled={isMeetingPast}
                    >
                      <ExternalLink className="h-4 w-4" /> Join Meeting
                    </Button>
                    <div className="text-xs text-center text-slate-400 mt-2 truncate px-2">
                      {meeting.join_url}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 max-sm:hidden">
            <Users className="h-8 w-8 text-blue-500" /> Meeting Scheduler
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and schedule team meetings.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg cursor-pointer gap-2"
        >
          <Plus className="h-4 w-4" /> Schedule Meeting
        </Button>
      </div>

      {/* Create / Edit Form Component - Reused for both but wrapped in separate Dialogs due to separate Open states */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Schedule New Meeting
            </DialogTitle>
          </DialogHeader>
          {/* Form Content */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Standup"
                className="bg-slate-50 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                placeholder="Meeting agenda..."
                className="bg-slate-50 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Meeting URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="url"
                  value={joinUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJoinUrl(e.target.value)
                  }
                  placeholder="https://meet.google.com/..."
                  className="pl-9 bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Multi-Select Users */}
            <div className="grid gap-2">
              <Label>Participants</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer dark:text-white"
                  >
                    {selectedUserIds.length > 0
                      ? `${selectedUserIds.length} users selected`
                      : "Select Participants"}
                    <Users className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[450px] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <DropdownMenuLabel className="dark:text-white">
                    Select Employees
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {users.map((user) => (
                    <DropdownMenuCheckboxItem
                      key={user.id}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800 dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 items-center justify-center">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="dark:text-white dark:border">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium dark:text-white">
                            {user.name}{" "}
                            <span className="text-xs text-slate-400">
                              ({user.role})
                            </span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email} | {user.department_name || "N/A"} |{" "}
                            {user.designation || "N/A"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-wrap gap-1 mt-2">
                {selectedUserIds.map((id) => {
                  const user = users.find((u) => u.id === id);
                  if (!user) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                      {user.name}
                      <span
                        className="cursor-pointer ml-1 hover:text-red-500"
                        onClick={() => toggleUserSelection(id)}
                      >
                        ×
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMeeting}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 cursor-pointer"
              >
                Schedule Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Edit Meeting Details
            </DialogTitle>
          </DialogHeader>
          {/* Form Content - Same as Create but with Update handler */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Standup"
                className="bg-slate-50 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e: any) => setDescription(e.target.value)}
                placeholder="Meeting agenda..."
                className="bg-slate-50 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start">Start Time</Label>
                <Input
                  id="edit-start"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end">End Time</Label>
                <Input
                  id="edit-end"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-url">Meeting URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="edit-url"
                  value={joinUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJoinUrl(e.target.value)
                  }
                  placeholder="https://meet.google.com/..."
                  className="pl-9 bg-slate-50 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Multi-Select Users */}
            <div className="grid gap-2">
              <Label>Participants</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-pointer dark:text-white"
                  >
                    {selectedUserIds.length > 0
                      ? `${selectedUserIds.length} users selected`
                      : "Select Participants"}
                    <Users className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[450px] max-h-[300px] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <DropdownMenuLabel className="dark:text-white">
                    Select Employees
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {users.map((user) => (
                    <DropdownMenuCheckboxItem
                      key={user.id}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800 dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 items-center justify-center">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="dark:text-white dark:border">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium dark:text-white">
                            {user.name}{" "}
                            <span className="text-xs text-slate-400">
                              ({user.role})
                            </span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email} | {user.department_name || "N/A"} |{" "}
                            {user.designation || "N/A"}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-wrap gap-1 mt-2">
                {selectedUserIds.map((id) => {
                  const user = users.find((u) => u.id === id);
                  if (!user) return null;
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                      {user.name}
                      <span
                        className="cursor-pointer ml-1 hover:text-red-500"
                        onClick={() => toggleUserSelection(id)}
                      >
                        ×
                      </span>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateMeeting}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Update Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-xl">
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          {viewMeeting && (
            <div className="space-y-4 py-2">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {viewMeeting.title}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {new Date(viewMeeting.start_time).toLocaleDateString(
                    "en-GB"
                  )}{" "}
                  {viewMeeting.start_time.substring(11, 16)} -{" "}
                  {viewMeeting.end_time.substring(11, 16)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <Label className="text-xs uppercase text-slate-500 font-semibold mb-1 block">
                  Description
                </Label>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {viewMeeting.description || "No description provided."}
                </p>
              </div>

              <div>
                <Label className="text-xs uppercase text-slate-500 font-semibold mb-2 block">
                  Participants ({viewMeeting.user_id?.length || 0})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {viewMeeting.user_id?.map((id) => {
                    const user = users.find((u) => u.id === id);
                    if (!user) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium dark:text-slate-200">
                          {user.name}
                        </span>
                      </div>
                    );
                  })}
                  {(!viewMeeting.user_id ||
                    viewMeeting.user_id.length === 0) && (
                      <span className="text-sm text-slate-400 italic">
                        No participants selected.
                      </span>
                    )}
                </div>
              </div>

              {viewMeeting.join_url && (
                <div className="pt-2">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer"
                    onClick={() => window.open(viewMeeting.join_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" /> Join Meeting
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="dark:text-white dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px] mb-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <TabsTrigger
            value="today"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400"
          >
            Today
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400"
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400"
          >
            Past Meetings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {renderMeetingList(todayMeetings)}
          {todayMeetings.length === 0 && (
            <div className="text-center text-sm text-slate-500 italic mt-2">
              No meetings scheduled for today.
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {renderMeetingList(futureMeetings)}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {renderMeetingList(pastMeetings)}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              Cancel Meeting?
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              This action cannot be undone. This will permanently delete the
              meeting and remove it from all participants' schedules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMeeting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer border-none"
            >
              Yes, Cancel Meeting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMeetings;
