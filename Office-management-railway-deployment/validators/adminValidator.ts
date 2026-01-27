import { z } from 'zod';

export const updateAdminSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        designation: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
        password: z.string().min(1, 'Password is required to save changes'),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});

export const toggleTwoFASchema = z.object({
    body: z.object({
        pin: z.string().min(1, 'Pin is required'),
    }),
});
