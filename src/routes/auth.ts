import { Router, type Response } from "express"
import * as z from 'zod'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { prisma } from "../prisma.js"
import type { RequestWithAuth } from '../types.js'
import { formatSuccess } from '../middleware/format-result.js'
import authenticate from '../middleware/authenticate.js'
import { generateTokens, hashPassword } from "../helpers/auth.js"
import { createUserSchema, loginUserSchema } from "../schemas/auth.schema.js"
import authorize from "../middleware/authorize.js"

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

    const { accessToken, refreshToken } = generateTokens({
        email: user.email,
        role: user.role ?? "user"
    })

    response.cookie('refresh', refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 2 * 24 * 3600 * 1000
    })

    formatSuccess(response, { accessToken }, "200")
})

authRouter.post('/refresh', async (request: RequestWithAuth, response: Response) => {
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

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        email: user.email,
        role: user.role ?? "user"
    })

    response.cookie('refresh', newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 2 * 24 * 3600 * 1000
    })

    formatSuccess(response, { accessToken }, "200")
})

authRouter.post('/logout', (_request: RequestWithAuth, response: Response) => {
    response.clearCookie('refresh')
    formatSuccess(response, { message: "Успешный выход" }, "200")
})

authRouter.get('/me', authenticate, (request: RequestWithAuth, response: Response) => {
    const result = { user: request.user! }

    formatSuccess(response, result, "200")
})

authRouter.delete('/:email', authenticate, authorize, async (request: RequestWithAuth, response: Response) => {
    const email = request.params['email'] as string

    await prisma.account.delete({
        where: {
            email
        }
    })

    formatSuccess(response, { message: "Аккаунт удалён" }, "202")
})