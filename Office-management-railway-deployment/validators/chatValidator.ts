import { z } from 'zod';

export const getOrCreateDirectChatSchema = z.object({
    body: z.object({
        targetUserId: z.union([z.string(), z.number()]),
    }),
});

export const createChatSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(['direct', 'group', 'space']),
        members: z.array(z.union([z.string(), z.number()])).optional(),
    }),
});

export const markMessagesReadSchema = z.object({
    body: z.object({
        chatId: z.union([z.string(), z.number()]),
    }),
});

export const manageMemberSchema = z.object({
    body: z.object({
        memberId: z.union([z.string(), z.number()]),
    }),
    params: z.object({
        chatId: z.string(),
    }),
});

export const addMembersSchema = z.object({
    body: z.object({
        members: z.array(z.union([z.string(), z.number()])),
    }),
    params: z.object({
        chatId: z.string(),
    }),
});
