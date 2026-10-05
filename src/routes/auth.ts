import { scrypt } from 'node:crypto'
import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import { prisma } from "../prisma.js"
import { formatSuccess } from '../middleware/format-result.js'

const createUserSchema = z.strictObject({
    email: z.email(),
    password: z.string(),
    role: z.optional(z.literal(['user', 'moderator', null])).default(null)
})

const hashPassword = (password: string): Promise<string> => new Promise((resolve, reject) => {
    scrypt(password, process.env.SALT, 32, (error, result) => {
        if (error) {
            reject(error)
        }
        resolve(result.toString('hex'))
    })
})

export const authRouter = Router()

authRouter.post('/register', async (request: Request, response: Response) => {
    const userData = z.parse(createUserSchema, request.body)

    const hashedPassword = await hashPassword(userData.password)

    const createdUser = await prisma.account.create({
        data: {
            email: userData.email,
            role: userData.role,
            password: hashedPassword
        }
    })

    formatSuccess(response, { createdUser }, "201")
})