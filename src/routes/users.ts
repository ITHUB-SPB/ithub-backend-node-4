import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import { accountsRepository } from '../repository/accounts.repository.js'
import { formatSuccess } from '../middleware/format-result.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { createProfileInputSchema } from '../schemas/accounts.schema.js'

export const usersRouter = Router()

usersRouter.get('/', authMiddleware, requireRole('moderator'), async (_req: Request, response: Response) => {
    const users = await accountsRepository.getAll()
    formatSuccess(response, users, "200")
})

usersRouter.get('/me', authMiddleware, async (request: Request, response: Response) => {
    const accountId = request.user!.id 
    const account = await accountsRepository.getMe(accountId)
    formatSuccess(response, account, "200")
})

usersRouter.post('/:id/profile', authMiddleware, async (request: Request, response: Response) => {
    const input = z.parse(createProfileInputSchema, {
        params: request.params,
        body: request.body,
        headers: request.headers
    })

    if (request.user!.id !== input.params.id && request.user!.role !== 'moderator') {
        const error = new Error('Forbidden') as any
        error.code = "403"
        throw error
    }

    const profile = await accountsRepository.upsertProfile(input.params.id, input.body)
    formatSuccess(response, profile, "200")
})