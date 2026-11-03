import { Router, type Request, type Response } from 'express'

import { prisma } from '../prisma.js'

import { authenticate, moderatorOnly } from '../middleware/authorize.js'

import {
    createProfileInputSchema
} from '../schemas/accounts.schema.js'

export const usersRouter = Router()

// GET /api/users

usersRouter.get(
    '/',
    authenticate,
    moderatorOnly,
    async (request: Request, response: Response) => {
        const page = Number(request.query['page'] ?? 1)
        const limit = Number(request.query['limit'] ?? 10)

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            response.status(400).json({
                success: false,
                error: 'Некорректные параметры пагинации'
            })
            return
        }

        const total = await prisma.account.count()

        const users = await prisma.account.findMany({
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        id: true,
                        bio: true,
                        avatar: true
                    }
                }
            }
        })

        response.json({
            success: true,
            data: users,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })
    }
)

// GET /api/users/me

usersRouter.get(
    '/me',
    authenticate,
    async (request: Request, response: Response) => {
        const user = await prisma.account.findUnique({
            where: {
                id: request.user!.id
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                profile: true,
                products: true
            }
        })

        if (!user) {
            response.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            })
            return
        }

        response.json({
            success: true,
            data: user
        })
    }
)

// POST /api/users/:id/profile

usersRouter.post(
    '/:id/profile',
    authenticate,
    async (request: Request, response: Response) => {
        const id = Number(request.params['id'])

        if (!Number.isInteger(id) || id <= 0) {
            response.status(400).json({
                success: false,
                error: 'Некорректный ID'
            })
            return
        }

        if (
            id !== request.user!.id &&
            request.user!.role !== 'moderator'
        ) {
            response.status(403).json({
                success: false,
                error: 'Нельзя изменять чужой профиль'
            })
            return
        }

        const input = createProfileInputSchema.parse(request.body)

        const account = await prisma.account.findUnique({
            where: { id }
        })

        if (!account) {
            response.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            })
            return
        }

        const profile = await prisma.profile.upsert({
            where: {
                accountId: id
            },

            create: {
                bio: input.bio,
                accountId: id,
                ...(input.avatar !== undefined
                    ? { avatar: input.avatar }
                    : {})
            },

            update: {
                bio: input.bio,
                ...(input.avatar !== undefined
                    ? { avatar: input.avatar }
                    : {})
            }
        })

        response.json({
            success: true,
            data: profile
        })
    }
)