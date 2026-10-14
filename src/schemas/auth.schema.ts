import * as z from 'zod'
import { accountSchema } from './accounts.schema.js'
import { inputSchema } from './common.schema.js'

export const getAuthSchema = accountSchema

export const createAuthSchema = inputSchema.extend({
    body: accountSchema.omit({
        id: true
    }).extend({
        role: z.literal(['user', 'moderator']).optional().default("user")
    })
})