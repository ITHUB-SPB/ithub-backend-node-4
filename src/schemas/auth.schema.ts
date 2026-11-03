import * as z from 'zod'
import { inputSchema } from './common.schema.js'

// Схема регистрации
export const createAuthSchema = inputSchema.extend({
    body: z.strictObject({
        email: z.email(),
        password: z.string().min(8)
    })
})

// Схема входа
export const loginSchema = inputSchema.extend({
    body: z.strictObject({
        email: z.email(),
        password: z.string().min(8)
    })
})