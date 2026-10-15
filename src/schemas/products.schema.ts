import * as z from "zod"
import { metaSchema } from "./common.schema.js"

const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'other'])

export const createProductInputSchema = z.object({
    body: z.strictObject({
        name: z.string().min(2).max(100),
        price: z.number().positive(),
        category: z.literal(['electronics', 'clothing', 'food', 'other']),
        description: z.nullable(z.string().max(500)),
        imageUrl: z.nullable(z.url()),
    }),
    headers: z.looseObject({
        Authorization: z.email()
    }),
})

export const productSchema = z.object({
    id: z.number().positive().int(),
    accountId: z.number().positive().int(),
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: z.literal(['electronics', 'clothing', 'food', 'other']),
    description: z.nullable(z.string().max(500)),
    imageUrl: z.nullable(z.url()),
    archived: z.boolean(),
    createdAt: z.date()
})

export const getProductOutputSchema = productSchema.extend({
    email: z.email()
})

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
        minPrice: z.coerce.number().nonnegative().optional().default(0), 
        maxPrice: z.coerce.number().positive().optional().default(Number.MAX_SAFE_INTEGER),
        page: z.coerce.number().positive().int().optional().default(1),
        limit: z.coerce.number().positive().int().optional().default(10)
    }),
})

export const getProductsInputSchema = z.object({
    query: z.object({
        category: z.optional(z.literal(['electronics', 'clothing', 'food', 'other'])),
        minPrice: z.optional(z.number().positive()).default(-Number.MAX_SAFE_INTEGER),
        maxPrice: z.optional(z.number().positive()).default(Number.MAX_SAFE_INTEGER),
        page: z.optional(z.number().positive().int()).default(1),
        limit: z.optional(z.number().positive().int()).default(10)
    }),
})

export const getProductsOutputSchema = z.array(productSchema)

export const getProductsWithMetaOutputSchema = z.object({
    data: getProductsOutputSchema,
    meta: metaSchema
})
