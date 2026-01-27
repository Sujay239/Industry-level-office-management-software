import { z } from 'zod';

export const addEmployeeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        designation: z.string().min(1, "Designation is required"),
        phone: z.string().min(1, "Phone is required"),
        location: z.string().min(1, "Location is required"),
        joining_date: z.string().or(z.date()),
        salary: z.union([z.number(), z.string()]),
        skills: z.union([z.array(z.string()), z.string()]),
        employment_type: z.string().min(1, "Employment type is required"),
        department_id: z.union([z.number(), z.string(), z.null()]).optional(),
        role: z.enum(['employee', 'manager', 'hr', 'admin', 'super_admin']),
    }),
});

export const updateEmployeeSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        designation: z.string().min(1, "Designation is required"),
        phone: z.string().min(1, "Phone is required"),
        location: z.string().min(1, "Location is required"),
        joining_date: z.string().or(z.date()),
        salary: z.union([z.number(), z.string()]),
        skills: z.union([z.array(z.string()), z.string()]).optional(),
        employment_type: z.string().min(1, "Employment type is required"),
        department_id: z.union([z.number(), z.string(), z.null()]).optional(),
        role: z.string().optional(),
    }),
    params: z.object({
        id: z.string(),
    }),
});

export const removeEmployeeSchema = z.object({
    body: z.object({
        reason: z.string().optional(),
        password: z.string().min(1, "Admin password is required"),
    }),
    params: z.object({
        id: z.string(),
    }),
});
