import * as z from "zod"

export const nonNegativeNumber = z.number().int().refine(value => value >= 0)

export const metaSchema = z.strictObject({
    total: nonNegativeNumber,
    page: nonNegativeNumber,
    limit: nonNegativeNumber,
    pages: nonNegativeNumber,
})

export const inputSchema = z.object({
    body: z.any(),
    query: z.any(),
    params: z.any(),
    headers: z.any()
})