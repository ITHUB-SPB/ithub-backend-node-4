import * as z from 'zod'
import { prisma } from '../prisma.js'

import { AccountsRepository } from "./abstract.js";
import { accounts } from "../data.js";

import { accountSchema, getAccountSchema } from '../schemas/accounts.schema.js';
import { getAuthSchema, createAuthSchema } from '../schemas/auth.schema.js';
import { inputSchema } from '../schemas/common.schema.js';

import type { DataWithMeta } from '../types.js';

type Account = z.output<typeof accountSchema>
type GetAccountOutput = z.output<typeof getAccountSchema>
type GetAuthOutput = z.output<typeof getAuthSchema>

class AccountsRepositorySqlite extends AccountsRepository<false> {
    override async add(record: z.output<typeof createAuthSchema>): Promise<GetAccountOutput> {
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

    override getAll(input: z.output<typeof inputSchema>): Promise<DataWithMeta<GetAccountOutput>> {
        return Promise.resolve({
            data: [
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
                }
            ],
            meta: {
                limit: 10,
                page: 1,
                pages: 1,
                total: 1
            }
        })
    }

    override async getOne(id: Account['id']): Promise<GetAccountOutput | GetAuthOutput | undefined> {
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

    override delete(id: Account['id']): Promise<void> {
        throw new Error("Not Implemented")
    }
}

class AccountsRepositoryMemory extends AccountsRepository<true> {
    private accounts: Account[];

    constructor() {
        super()
        this.accounts = accounts;
    }

    override getAll(input: z.output<typeof inputSchema>): DataWithMeta<GetAccountOutput> {
        const meta = {
            total: 0,
            page: 0,
            limit: 10,
            pages: 0,
        } as const;

        return { data: [], meta }
    }

    override getOne(id: Account['id']): GetAccountOutput | GetAuthOutput | undefined {
        return { id: 1, email: "test@example.com", role: "user" }
    }

    override add(record: z.output<typeof createAuthSchema>): GetAccountOutput {
        const lastId = this.accounts.at(-1)?.id ?? 0
        this.accounts.push({ ...record.body, id: lastId + 1 })

        return { ...this.accounts.at(-1)!, email: "test@example.com" }
    }

    override delete(id: Account['id']): void {
        throw new Error("Not Implemented")
    }

}

export const accountsRepository = !process.env['DATABASE_URL'] ? new AccountsRepositoryMemory() : new AccountsRepositorySqlite()