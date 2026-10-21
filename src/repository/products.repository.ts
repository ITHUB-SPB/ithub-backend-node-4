import { Category, Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../prisma.js'
import type {
    CreateProductBody,
    GetManyProductsQuery,
    UpdateProductBody,
} from '../schemas/products.schema.js'
import { ProductsRepository } from './abstract.js'

const productListSelect = {
    id: true,
    name: true,
    price: true,
    category: true,
    description: true,
    imageUrl: true,
    archived: true,
    createdAt: true,
    accountId: true,
    account: {
        select: { email: true },
    },
} as const

function serializeProduct(product: Prisma.ProductGetPayload<{ select: typeof productListSelect }>) {
    const { account, ...record } = product
    return { ...record, email: account.email }
}

class ProductsRepositorySqlite extends ProductsRepository {
    protected readonly name = 'products'

    async getAll(query: GetManyProductsQuery) {
        const where: Prisma.ProductWhereInput = {
            ...(query.category ? { category: query.category as Category } : {}),
            ...(query.creator ? { account: { email: query.creator } } : {}),
            ...(query.minPrice !== undefined || query.maxPrice !== undefined
                ? {
                    price: {
                        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
                        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
                    },
                }
                : {}),
        }

        const [total, records] = await prisma.$transaction([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                select: productListSelect,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
        ])

        return {
            data: records.map(serializeProduct),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                pages: Math.ceil(total / query.limit),
            },
        }
    }

    async getOne(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                ...productListSelect,
                account: {
                    select: {
                        email: true,
                        profile: {
                            select: {
                                bio: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        })

        if (!product) return null

        const { account, ...record } = product
        return {
            ...record,
            email: account.email,
            profile: account.profile,
        }
    }

    async getOwnerId(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { accountId: true },
        })

        return product?.accountId ?? null
    }

    async add(input: CreateProductBody, accountId: number, imageUrl: string | null) {
        const product = await prisma.product.create({
            data: {
                name: input.name,
                price: input.price,
                category: input.category,
                ...(input.description !== undefined ? { description: input.description } : {}),
                imageUrl,
                accountId,
            },
            select: productListSelect,
        })

        return serializeProduct(product)
    }

    async update(id: number, input: UpdateProductBody, imageUrl?: string) {
        const data: Prisma.ProductUpdateInput = {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.price !== undefined ? { price: input.price } : {}),
            ...(input.category !== undefined ? { category: input.category } : {}),
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {}),
        }

        const product = await prisma.product.update({
            where: { id },
            data,
            select: productListSelect,
        })

        return serializeProduct(product)
    }
}

export const productsRepository = new ProductsRepositorySqlite()
