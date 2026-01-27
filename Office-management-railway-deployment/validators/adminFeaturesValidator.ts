import { z } from 'zod';

// Departments
export const departmentSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Department name is required'),
        description: z.string().optional(),
        manager_id: z.union([z.string(), z.number(), z.null()]).optional(),
    }),
});

// Holidays
export const holidaySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Holiday name is required'),
        date: z.string().min(1, 'Date is required'),
        type: z.string().min(1, 'Type is required'),
    }),
});

// Announcements
export const announcementSchema = z.object({
    body: z.object({
        subject: z.string().min(1, 'Subject is required'),
        message: z.string().min(1, 'Message is required'),
        priority: z.string().optional(),
    }),
});

// IPs
export const ipSchema = z.object({
    body: z.object({
        ip_address: z.string().min(1, 'IP address is required'),
        label: z.string().optional(),
    }),
});

// Meetings
export const meetingSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        start_time: z.string().min(1, 'Start time is required'),
        end_time: z.string().min(1, 'End time is required'),
        join_url: z.string().optional(),
        user_ids: z.array(z.union([z.number(), z.string()])).optional(),
    }),
});

