
import * as z from 'zod'
import { prisma } from '../prisma.js'

import { AccountsRepository } from './abstract.js'
import { accounts } from '../data.js'

import { accountSchema } from '../schemas/accounts.schema.js'
import { inputSchema } from '../schemas/common.schema.js'

import type { DataWithMeta } from '../types.js'

type Account = z.output<typeof accountSchema>
type RepositoryInput = z.output<typeof inputSchema>

type CreateAccountInput = {
    email: string
    password: string
}

function getPagination(input: RepositoryInput) {
    const query = input.query as {
        page?: number | string
        limit?: number | string
    }

    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.max(1, Number(query.limit) || 10)

    return { page, limit }
}

class AccountsRepositorySqlite extends AccountsRepository<false> {
    override async add(
        record: RepositoryInput
    ): Promise<Partial<Account>> {
        const body = record.body as CreateAccountInput

        return prisma.account.create({
            data: {
                email: body.email,
                password: body.password
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        })
    }

    override async getAll(
        input: RepositoryInput
    ): Promise<DataWithMeta<Partial<Account>>> {
        const { page, limit } = getPagination(input)

        const [data, total] = await Promise.all([
            prisma.account.findMany({
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            }),

            prisma.account.count()
        ])

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    }

    override async getOne(
        id: Account['id']
    ): Promise<Partial<Account> | undefined> {
        const account = await prisma.account.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        return account ?? undefined
    }

    override async delete(
        id: Account['id']
    ): Promise<void> {
        await prisma.account.delete({
            where: { id }
        })
    }
}

class AccountsRepositoryMemory extends AccountsRepository<true> {
    private accounts: Account[]

    constructor() {
        super()
        this.accounts = accounts
    }

    override getAll(
        input: RepositoryInput
    ): DataWithMeta<Partial<Account>> {
        const { page, limit } = getPagination(input)

        const total = this.accounts.length

        const data = this.accounts
            .slice((page - 1) * limit, page * limit)
            .map(account => ({
                id: account.id,
                email: account.email,
                role: account.role,
                createdAt: account.createdAt
            }))

        return {
            data,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    }

    override getOne(
        id: Account['id']
    ): Partial<Account> | undefined {
        const account = this.accounts.find(
            account => account.id === id
        )

        if (!account) {
            return undefined
        }

        return {
            id: account.id,
            email: account.email,
            role: account.role,
            createdAt: account.createdAt
        }
    }

    override add(record: RepositoryInput): Partial<Account> {
        const body = record.body as CreateAccountInput

        const lastId = this.accounts.at(-1)?.id ?? 0

        const account: Account = {
            id: lastId + 1,
            email: body.email,
            password: body.password,
            role: 'user',
            createdAt: new Date()
        }

        this.accounts.push(account)

        return {
            id: account.id,
            email: account.email,
            role: account.role,
            createdAt: account.createdAt
        }
    }

    override delete(id: Account['id']): void {
        const index = this.accounts.findIndex(
            account => account.id === id
        )

        if (index === -1) {
            throw new Error('Аккаунт не найден')
        }

        this.accounts.splice(index, 1)
    }
}

export const accountsRepository = process.env['DATABASE_URL']
    ? new AccountsRepositorySqlite()
    : new AccountsRepositoryMemory()
