import * as z from 'zod'
import { createAccountInputSchema } from './accounts.schema.js'
import { inputSchema } from './common.schema.js'

// Схема для входа (логин)
export const loginInputSchema = z.object({
    body: z.strictObject({
        email: z.string().email(),
        password: z.string(),
    })
})

export const registerInputSchema = createAccountInputSchema