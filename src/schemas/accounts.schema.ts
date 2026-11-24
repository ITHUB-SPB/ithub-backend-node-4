import * as z from 'zod'

export const getAccountSchema = z.object({
    id: z.number().int().positive(),
    email: z.string().email(),
    role: z.enum(['user', 'moderator']),
    createdAt: z.date(),
})

export const createAccountInputSchema = z.object({
    body: z.strictObject({
        email: z.string().email(),
        password: z.string().min(8),
    })
})

export const loginInputSchema = z.object({
    body: z.strictObject({
        email: z.string().email(),
        password: z.string(),
    })
})

export const createProfileInputSchema = z.object({
    params: z.object({
        id: z.coerce.number().positive().int()
    }),
    body: z.strictObject({
        bio: z.string().min(3),
        avatar: z.string().nullable().optional(),
    }),
    headers: z.looseObject({
        authorization: z.string() 
    })
})