import * as z from 'zod'

export const positiveIdSchema = z.coerce.number().int().positive()

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
})

export const metaSchema = z.strictObject({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
})

export const authorizationSchema = z.string().regex(/^Bearer\s+.+$/i, 'Ожидается Bearer access token')

export const trimmedEmailSchema = z.preprocess(
    value => typeof value === 'string' ? value.trim() : value,
    z.email(),
)
