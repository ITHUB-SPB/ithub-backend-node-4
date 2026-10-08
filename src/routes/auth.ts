import { scrypt } from 'node:crypto'
import { Router, type NextFunction, type Response } from "express"
import * as z from 'zod'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { prisma } from "../prisma.js"
import type { RequestWithAuth } from '../types.js'
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

const authenticate = (request: RequestWithAuth, _response: Response, next: NextFunction) => {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        return next(new Error('Отсутствует информация для аутентификации'))
    }

    const authString = authHeader?.match(/Bearer (.*)/)
    const accessToken = authString?.at(1)

    if (!authString || !accessToken) {
        return next(new Error('Некорректный формат данных для аутентификации'))
    }

    const payload = jwt.verify(accessToken, process.env.JWT_SECRET) as JwtPayload

    // @ts-expect-error
    request.user = payload
    next()
}

export const authRouter = Router()

authRouter.post('/register', async (request: RequestWithAuth, response: Response) => {
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

authRouter.post('/login', async (request: RequestWithAuth, response: Response) => {
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
        process.env.JWT_SECRET,
        { expiresIn: "1m" }
    )

    const refreshToken = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    )

    response.cookie('refresh', refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 5
        // maxAge: 7 * 24 * 3600 * 1000 // 7d
    })

    formatSuccess(response, { accessToken }, "200")
})

authRouter.post('/refresh', async (request: RequestWithAuth, response: Response) => {
    console.log(request.signedCookies)
    const refreshToken = request.cookies['refresh']

    if (!refreshToken) {
        throw new Error('Токен не передан')
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET) as JwtPayload

    if (!payload['email']) {
        throw new Error('Отсутствуют пользовательские данные')
    }

    const user = await prisma.account.findUnique({
        where: {
            email: payload['email']
        }
    })

    if (!user) {
        throw new Error('Пользователь не найден')
    }

    const accessToken = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1m" }
    )

    const newRefreshToken = jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
    )

    response.cookie('refresh', newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 5
        // maxAge: 7 * 24 * 3600 * 1000 // 7d
    })

    formatSuccess(response, { accessToken }, "200")
})

authRouter.get('/me', authenticate, (request: RequestWithAuth, response: Response) => {
    const result = { user: request.user! }

    formatSuccess(response, result, "200")
})