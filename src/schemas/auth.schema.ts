import * as z from 'zod'
import { createAccountInputSchema } from './accounts.schema.js'
import { trimmedEmailSchema } from './common.schema.js'

export const registerInputSchema = createAccountInputSchema

export const loginInputSchema = z.object({
    body: z.object({
        email: trimmedEmailSchema,
        password: z.string().min(1).max(128),
    }),
})