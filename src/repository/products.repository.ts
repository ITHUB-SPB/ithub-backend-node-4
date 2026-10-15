import * as z from 'zod'
import { prisma } from '../prisma.js'

import { ProductsRepository } from "./abstract.js";
import { productSchema, createProductInputSchema, getProductOutputSchema, getProductsInputSchema, getProductsWithMetaOutputSchema } from '../schemas/products.schema.js'
import { products } from "../data.js";

type Product = z.output<typeof productSchema>

class ProductsRepositorySqlite extends ProductsRepository<false> {
    override async add(record: z.output<typeof createProductInputSchema>): Promise<z.output<typeof getProductOutputSchema>> {
        try {
            const { account, ...rest } = await prisma.product.create({
                data: {
                    ...record.body,
                    account: {
                        connect: {
                            email: record.headers.Authorization
                        }
                    }
                },
                include: {
                    account: {
                        select: {
                            email: true
                        }
                    }
                },
            })

            return { ...rest, email: account.email }
        } catch (error) {
            throw error
        }
    }

    override async getAll(input: z.output<typeof getProductsInputSchema>): Promise<z.output<typeof getProductsWithMetaOutputSchema>> {
        const products = await prisma.product.findMany({
            where: {
                category: {
                    equals: input.query.category
                },
                price: {
                    gte: input.query.minPrice,
                    lte: input.query.maxPrice
                },
            },
            include: { account: { select: { email: true } } }
        });

        const formattedData = products.map(({ account, ...product }) => ({
            ...product,
            email: account.email
        }));

        return {
            data: formattedData,
            meta: {
                limit: 10,
                page: 1,
                pages: 1,
                total: formattedData.length
            }
        };
    }

    override async getOne(id: number | string): Promise<z.output<typeof getProductOutputSchema>> {
        return Promise.resolve({
            id: 1,
            name: "bloose",
            category: "clothing",
            description: "xl",
            price: 4200,
            imageUrl: null,
            accountId: 1,
            archived: false,
            createdAt: new Date(2022, 8, 10),
            email: "test@example.com"
        })
    }

    override async delete(id: number | string): Promise<void> {
        return
    }
}

class ProductsRepositoryMemory extends ProductsRepository<true> {
    private products: Product[];

    constructor() {
        super()
        this.products = products;
    }

    override getAll(input: z.output<typeof getProductsInputSchema>): z.output<typeof getProductsWithMetaOutputSchema> {
        const filteredData = this.products.filter((product) => {
            if (product.category && product.category !== input.query.category) {
                return false
            }
            return product.price >= input.query.minPrice && product.price <= input.query.maxPrice
        })

        const paginatedData = filteredData.slice((input.query.page - 1) * input.query.limit, input.query.page * input.query.limit)

        const meta = {
            total: this.products.length,
            page: input.query.page,
            limit: input.query.limit,
            pages: Math.ceil(this.products.length / input.query.limit),
        } as const;

        return { data: paginatedData, meta }
    }

    override getOne(id: number | string): z.output<typeof getProductOutputSchema> {
        const record = this.products.find(product => product.id === id)

        if (!record) {
            throw new Error('Record not found')
        }

        return { ...record, email: "test@example.com" }
    }

    override add(record: z.output<typeof createProductInputSchema>): z.output<typeof getProductOutputSchema> {
        const lastId = this.products.at(-1)?.id ?? 0
        this.products.push({ ...record.body, id: lastId + 1, archived: false, accountId: 1, createdAt: new Date() })

        return { ...this.products.at(-1)!, email: "test@example.com" }
    }

    override delete(id: number): void {
        const recordIndex = this.products.findIndex(product => product.id === id)

        if (recordIndex === -1) {
            throw new Error('Record not found')
        }

        this.products.splice(recordIndex, 1)
    }
}

export const productsRepository = !process.env['DATABASE_URL'] ? new ProductsRepositoryMemory() : new ProductsRepositorySqlite()