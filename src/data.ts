import * as z from 'zod'
import { productSchema } from "./schemas/products.schema.js"
import { accountSchema } from "./schemas/accounts.schema.js"

export const accounts: z.output<typeof accountSchema>[] = []

export const products: z.output<typeof productSchema>[] = [
    {
        id: 1,
        name: "bloose",
        category: "clothing",
        description: "xl",
        price: 4200,
        imageUrl: null,
        accountId: 1,
        archived: false,
        createdAt: new Date(2022, 8, 10)
    },
    {
        id: 2,
        name: "jacket",
        category: "clothing",
        description: "sm",
        price: 13100,
        imageUrl: null,
        accountId: 1,
        archived: false,
        createdAt: new Date(2022, 9, 11)
    },
    {
        id: 3,
        name: "ebook",
        category: "electronics",
        description: "sm",
        price: 6500,
        imageUrl: null,
        accountId: 1,
        archived: false,
        createdAt: new Date(2023, 2, 8)
    }
]
