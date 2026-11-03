import * as z from "zod"
import { metaSchema } from "./common.schema.js"

const categorySchema = z.literal(['electronics', 'clothing', 'food', 'other'])

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: z.optional(categorySchema),
        minPrice: z.optional(z.coerce.number().positive()).default(-Number.MAX_SAFE_INTEGER),
        maxPrice: z.optional(z.coerce.number().positive()).default(Number.MAX_SAFE_INTEGER),
        page: z.optional(z.coerce.number().positive().int()).default(1),
        limit: z.optional(z.coerce.number().positive().int()).default(10),
    }),
})

export const createProductInputSchema = z.object({
    headers: z.looseObject({
        authorization: z.email()
    }),
    body: z.strictObject({
        name: z.string().min(2).max(100),
        price: z.coerce.number().positive(),
        category: categorySchema,
        description: z.optional(z.string().max(500)),
    }),
})

export const updateProductInputSchema = z.object({
    headers: z.looseObject({
        authorization: z.email()
    }),
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
    body: z.strictObject({
        name: z.optional(z.string().min(2).max(100)),
        price: z.optional(z.coerce.number().positive()),
        category: z.optional(categorySchema),
        description: z.optional(z.string().max(500)),
    }),
})

export const productSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: categorySchema,
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    archived: z.boolean(),
    accountEmail: z.email(),
    createdAt: z.date(),
})

export const getProductOutputSchema = productSchema

export const getProductsWithMetaOutputSchema = z.object({
    data: z.array(productSchema),
    meta: metaSchema,
})
export const getProductsInputSchema = getManyProductsInputSchema;