import { prisma } from '../prisma.js'
import { AccountsRepository } from './abstract.js'

class AccountsRepositorySqlite extends AccountsRepository {
    protected readonly name = 'accounts'

    async add(email: string, password: string) {
        return prisma.account.create({
            data: { email, password },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        })
    }

    async getByEmail(email: string) {
        return prisma.account.findUnique({
            where: { email },
        })
    }

    async getAll(page: number, limit: number) {
        const [total, data] = await prisma.$transaction([
            prisma.account.count(),
            prisma.account.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    profile: {
                        select: {
                            id: true,
                            bio: true,
                            avatar: true,
                        },
                    },
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ])

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        }
    }

    async getOne(id: number) {
        return prisma.account.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        id: true,
                        bio: true,
                        avatar: true,
                    },
                },
                products: true,
            },
        })
    }

    async getId(id: number) {
        const account = await prisma.account.findUnique({
            where: { id },
            select: { id: true },
        })

        return account?.id ?? null
    }

    async saveProfile(id: number, bio: string, avatar?: string) {
        return prisma.profile.upsert({
            where: { accountId: id },
            create: {
                bio,
                ...(avatar !== undefined ? { avatar } : {}),
                accountId: id,
            },
            update: {
                bio,
                ...(avatar !== undefined ? { avatar } : {}),
            },
        })
    }
}

export const accountsRepository = new AccountsRepositorySqlite()
