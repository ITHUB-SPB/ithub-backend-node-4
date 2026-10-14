import * as z from 'zod'

export const accountSchema = z.object({
    id: z.number().positive().int(),
    email: z.email(),
    password: z.string().min(8),
    role: z.literal(['user', 'moderator'])
})

export const getAccountSchema = accountSchema.omit({
    password: true,
})