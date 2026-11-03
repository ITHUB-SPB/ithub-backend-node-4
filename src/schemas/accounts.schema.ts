import * as z from 'zod'

export const accountSchema = z.object({
    id: z.number().int().positive(),
    email: z.email(),
    password: z.string(),
    role: z.enum(['user', 'moderator']),
    createdAt: z.date()
})

export const createAccountInputSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
})

export const createProfileInputSchema = z.strictObject({
    bio: z.string().min(3),
    avatar: z.string().optional()
})