import * as z from 'zod'

export const createUserSchema = z.strictObject({
    email: z.email(),
    password: z.string(),
    role: z.optional(z.literal(['user', 'moderator', null])).default(null)
})

export const loginUserSchema = createUserSchema.omit({
    role: true
})