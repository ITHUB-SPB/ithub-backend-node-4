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
    file: z.object({
        mimetype: z.string().refine(val => ['image/jpeg', 'image/png'].includes(val), {
            message: "Only JPEG and PNG formats are allowed"
        }),
        size: z.number().max(2 * 1024 * 1024, { message: "File size must be under 2MB" })
    }).optional()
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
        limit: z.coerce.number().positive().int().optional().default(10),
        email: z.email()
    }),
})

export const getProductInputSchema = z.object({
    params: z.object({
        id: z.coerce.number().positive().int()
    })
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

export const getProductsOutputSchema = z.array(getProductOutputSchema)

export const getProductsWithMetaOutputSchema = z.object({
    data: getProductsOutputSchema,
    meta: metaSchema
})
