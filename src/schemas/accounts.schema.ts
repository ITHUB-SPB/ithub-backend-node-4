import * as z from 'zod'
import { authorizationSchema, metaSchema, paginationSchema, positiveIdSchema, trimmedEmailSchema } from './common.schema.js'

export const roleSchema = z.enum(['user', 'moderator'])

export const profileSchema = z.object({
    id: z.number().int().positive(),
    bio: z.string().min(3),
    avatar: z.string().nullable(),
})

export const accountSchema = z.object({
    id: z.number().int().positive(),
    email: z.email(),
    role: roleSchema,
    createdAt: z.date(),
})

export const createAccountInputSchema = z.object({
    body: z.object({
        email: trimmedEmailSchema,
        password: z.string().min(8).max(128),
    }),
})

export const getManyAccountsInputSchema = z.object({ query: paginationSchema })

export const createProfileInputSchema = z.object({
    params: z.object({ id: positiveIdSchema }),
    headers: z.object({ authorization: authorizationSchema }),
    body: z.object({
        bio: z.string().trim().min(3).max(500),
        avatar: z.preprocess(value => value === '' || value === null ? undefined : value, z.url().optional()),
    }),
})

export const accountsWithMetaSchema = z.object({
    data: z.array(accountSchema.extend({ profile: profileSchema.nullable() })),
    meta: metaSchema,
})
