import { Router } from 'express'
import { prisma } from '../prisma.js'
import { createAuthSchema } from '../schemas/auth.schema.js'
import { loginSchema } from '../schemas/auth.schema.js'
import {
    createAccessToken,
    createRefreshToken,
    verifyToken
} from '../utils/auth.js'

const authRouter = Router()

// Регистрация
authRouter.post('/register', async (request, response, next) => {
    try {
        const input = createAuthSchema.parse(request)

        const existingAccount = await prisma.account.findUnique({
            where: {
                email: input.body.email
            }
        })

        if (existingAccount) {
            response.status(409).json({
                message: 'Email уже занят'
            })
            return
        }

        const account = await prisma.account.create({
            data: {
                email: input.body.email,
                password: input.body.password
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        response.status(201).json(account)
    } catch (error) {
        next(error)
    }
})

// Вход
authRouter.post('/login', async (request, response, next) => {
    try {
        const input = loginSchema.parse(request)

        const account = await prisma.account.findUnique({
            where: {
                email: input.body.email
            }
        })

        if (!account || account.password !== input.body.password) {
            response.status(401).json({
                message: 'Неверный email или пароль'
            })
            return
        }

        const accessToken = createAccessToken(account)
        const refreshToken = createRefreshToken(account)

        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        response.json({
            accessToken
        })
    } catch (error) {
        next(error)
    }
})

// Обновление access-токена
authRouter.post('/refresh', async (request, response, next) => {
    try {
        const refreshToken = request.cookies?.refreshToken

        if (!refreshToken) {
            response.status(401).json({
                message: 'Refresh token отсутствует'
            })
            return
        }

        const payload = verifyToken(
            refreshToken,
            'refresh'
        )

        const account = await prisma.account.findUnique({
            where: {
                id: payload.sub
            }
        })

        if (!account) {
            response.status(401).json({
                message: 'Аккаунт не найден'
            })
            return
        }

        const accessToken = createAccessToken(account)

        response.json({
            accessToken
        })
    } catch (error) {
        next(error)
    }
})

// Выход
authRouter.post('/logout', (_request, response) => {
    response.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        path: '/api/auth'
    })

    response.json({
        message: 'Выход выполнен'
    })
})

export default authRouter