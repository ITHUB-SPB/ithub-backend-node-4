
import * as z from 'zod'
import { accountSchema } from './schemas/accounts.schema.js'

export const accounts: z.output<typeof accountSchema>[] = []
