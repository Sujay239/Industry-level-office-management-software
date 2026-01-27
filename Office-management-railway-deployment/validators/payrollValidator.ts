import { z } from 'zod';

export const payPayrollSchema = z.object({
    body: z.object({
        basic_salary: z.coerce.number(),
        allowances: z.coerce.number(),
        deductions: z.coerce.number(),
    }),
    params: z.object({
        id: z.string(),
    }),
});
