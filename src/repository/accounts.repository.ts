import * as z from 'zod'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { prisma } from '../prisma.js'
import type { ErrorWithCode } from '../types.js'
import { 
    createAccountInputSchema, 
    createProfileInputSchema
} from '../schemas/accounts.schema.js'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
    return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':')
    if (!salt || !key) return false
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
    const keyBuffer = Buffer.from(key, 'hex')
    return timingSafeEqual(derivedKey, keyBuffer)
}

export class AccountsRepository {
    async create(data: z.output<typeof createAccountInputSchema>['body']) {
        const existing = await prisma.account.findUnique({ where: { email: data.email } })
        if (existing) {
            const error = new Error('Email already exists') as ErrorWithCode
            error.code = "409"
            throw error
        }

        const hashedPassword = await hashPassword(data.password)
        
        const account = await prisma.account.create({
            data: {
                email: data.email,
                password: hashedPassword,
            }
        })

        const { password, ...safeAccount } = account
        return safeAccount
    }

    async findByEmail(email: string) {
        return prisma.account.findUnique({ where: { email } })
    }

    async validatePassword(password: string, hash: string) {
        return verifyPassword(password, hash)
    }

    async getAll() {
        const accounts = await prisma.account.findMany({
            include: { profile: true }
        })
        return accounts.map(acc => {
            const { password, ...safeAcc } = acc
            return safeAcc
        })
    }

    async getMe(accountId: number) {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: { profile: true, products: true }
        })
        if (!account) {
            const error = new Error('Account not found') as ErrorWithCode
            error.code = "404"
            throw error
        }
        const { password, ...safeAcc } = account
        return safeAcc
    }

    async upsertProfile(accountId: number, data: z.output<typeof createProfileInputSchema>['body']) {
        const profile = await prisma.profile.upsert({
            where: { accountId },
            create: {
                accountId,
                bio: data.bio,
                avatar: data.avatar ?? null
            },
            update: {
                bio: data.bio,
                ...(data.avatar !== undefined && { avatar: data.avatar })
            }
        })
        return profile
    }
}

export const accountsRepository = new AccountsRepository()