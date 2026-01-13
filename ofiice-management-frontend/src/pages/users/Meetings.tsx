
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, ExternalLink, CalendarCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "../../components/NotificationProvider";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

interface Meeting {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    join_url: string;
    user_id: number[];
}

const Meetings: React.FC = () => {
    const { showError } = useNotification();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMeeting, setViewMeeting] = useState<Meeting | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/employee/dashboard/meetings`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Failed to fetch meetings");
            const data = await response.json();
            setMeetings(data.meetings);
        } catch (error) {
            console.error(error);
            showError("Failed to load meetings");
        } finally {
            setIsLoading(false);
        }
    };

    const openViewModal = (meeting: Meeting) => {
        setViewMeeting(meeting);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(todayStart);
    startOfTomorrow.setDate(todayStart.getDate() + 1);

    const isSameDate = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const pastMeetings = meetings.filter(m => {
        const mStart = new Date(m.start_time);
        const mEnd = new Date(m.end_time);
        return mStart < todayStart || mEnd < now;
    });

    const todayMeetings = meetings.filter(m => {
        const mStart = new Date(m.start_time);
        const mEnd = new Date(m.end_time);
        return isSameDate(mStart, todayStart) && mEnd >= now;
    });

    const futureMeetings = meetings.filter(m => {
        const mStart = new Date(m.start_time);
        return mStart >= startOfTomorrow;
    });

    const renderMeetingList = (list: Meeting[], emptyMsg: string) => {
        if (isLoading) return <div className="text-center py-10">Loading meetings...</div>;
        if (list.length === 0) return <div className="text-center text-slate-500 py-10">{emptyMsg}</div>;

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {list.map((meeting) => {
                    const isMeetingPast = new Date(meeting.end_time) < now;
                    return (
                        <Card key={meeting.id} className="relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:shadow-md transition-all cursor-pointer group" onClick={() => openViewModal(meeting)}>
                            <div className={`absolute top-0 left-0 w-1 h-full ${!isMeetingPast ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <CardHeader className="pb-2 pl-6">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4" title={meeting.title}>
                                        {meeting.title}
                                    </CardTitle>
                                    {!isMeetingPast && (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Upcoming</Badge>
                                    )}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(meeting.start_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </div>
                            </CardHeader>
                            <CardContent className="pl-6 pt-0 space-y-3">
                                <div className="flex items-center text-sm font-medium text-slate-700 dark:text-white">
                                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                    {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                {meeting.description && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {meeting.description}
                                    </p>
                                )}

                                <div className="pt-2">
                                    <Button
                                        size="sm"
                                        className={`w-full gap-2 ${isMeetingPast ? 'bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100 dark:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isMeetingPast) window.open(meeting.join_url, '_blank');
                                        }}
                                        disabled={isMeetingPast}
                                    >
                                        <ExternalLink className="h-4 w-4" /> {isMeetingPast ? "Ended" : "Join Meeting"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 px-6 lg:p-10 animate-in fade-in duration-500">
            <div className="space-y-8">
                <div className="lg:sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur support-[backdrop-filter]:bg-slate-50/50 py-4 -mx-6 px-6 lg:-mx-10 lg:px-10 border-b border-slate-200/50 dark:border-slate-800/50 mb-6 transition-all duration-200 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <CalendarCheck2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white max-sm:hidden">My Meetings</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">View and join your scheduled meetings</p>
                    </div>
                </div>

                <Tabs defaultValue="today" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <TabsTrigger value="today" className="cursor-pointer data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400">Today</TabsTrigger>
                        <TabsTrigger value="upcoming" className="cursor-pointer data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400">Upcoming</TabsTrigger>
                        <TabsTrigger value="past" className="cursor-pointer data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400">Past</TabsTrigger>
                        <TabsTrigger value="all" className="cursor-pointer data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 dark:text-slate-400">All</TabsTrigger>
                    </TabsList>

                    <TabsContent value="today" className="space-y-4 min-h-[50vh]">
                        {renderMeetingList(todayMeetings, "No meetings scheduled for today.")}
                    </TabsContent>

                    <TabsContent value="upcoming" className="space-y-4 min-h-[50vh]">
                        {renderMeetingList(futureMeetings, "No upcoming meetings found.")}
                    </TabsContent>

                    <TabsContent value="past" className="space-y-4 min-h-[50vh]">
                        {renderMeetingList(pastMeetings, "No past meetings found.")}
                    </TabsContent>

                    <TabsContent value="all" className="space-y-4 min-h-[50vh]">
                        {renderMeetingList(meetings, "No meetings found.")}
                    </TabsContent>
                </Tabs>

                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white text-xl">Meeting Details</DialogTitle>
                        </DialogHeader>
                        {viewMeeting && (
                            <div className="space-y-4 py-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{viewMeeting.title}</h3>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4" />
                                        {new Date(viewMeeting.start_time).toLocaleString('en-GB')} - {new Date(viewMeeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewMeeting.description || "No description provided."}</p>
                                </div>

                                {viewMeeting.join_url && (
                                    <div className="pt-2">
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer"
                                            onClick={() => window.open(viewMeeting.join_url, '_blank')}
                                            disabled={new Date(viewMeeting.end_time) < now}
                                        >
                                            <ExternalLink className="h-4 w-4" /> {new Date(viewMeeting.end_time) < now ? "Meeting Ended" : "Join Meeting"}
                                        </Button>
                                        <div className="text-xs text-center text-slate-400 mt-2 truncate px-2 select-all">
                                            {viewMeeting.join_url}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Meetings;
