import { scrypt } from 'node:crypto'
import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import jwt from 'jsonwebtoken'

import { prisma } from "../prisma.js"
import { formatSuccess } from '../middleware/format-result.js'

const createUserSchema = z.strictObject({
    email: z.email(),
    password: z.string(),
    role: z.optional(z.literal(['user', 'moderator', null])).default(null)
})

const loginUserSchema = createUserSchema.omit({
    role: true
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

    const prismaData = {
        email: userData.email,
        password: await hashPassword(userData.password),
        role: userData.role
    }

    if (!userData.role) {
        // @ts-expect-error
        delete prismaData['role']
    }

    const createdUser = await prisma.account.create({
        data: prismaData
    })

    formatSuccess(response, { createdUser }, "201")
})

authRouter.post('/login', async (request: Request, response: Response) => {
    const loginData = z.parse(loginUserSchema, request.body)

    const hashedPassword = await hashPassword(loginData.password)

    const user = await prisma.account.findUnique({
        where: {
            email: loginData.email,
            password: hashedPassword
        }
    })

    if (!user) {
        throw new Error('Пользователь не найден')
    }

    const accessToken = jwt.sign(
        { email: user.email, role: user.role }, 
        process.env.JWT_SECRET
    )

    formatSuccess(response, { accessToken }, "200")
})