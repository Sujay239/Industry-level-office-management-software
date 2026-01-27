import { z } from 'zod';

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
        forceLogout: z.boolean().optional(),
    }),
});

export const authorizedTwoFASchema = z.object({
    body: z.object({
        code: z.string().min(1, "Code is required"),
    }),
});

export const verifyPasswordSchema = z.object({
    body: z.object({
        password: z.string().min(1, "Password is required"),
    }),
});
