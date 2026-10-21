import { Router } from 'express'

import { requireAuth, requireModerator } from '../auth.js'
import { formatSuccess } from '../middleware/format-result.js'
import { accountsRepository } from '../repository/accounts.repository.js'
import {
    createProfileInputSchema,
    getManyAccountsInputSchema,
} from '../schemas/accounts.schema.js'
import { HttpError } from '../types.js'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireModerator, async (request, response) => {
    const { query } = getManyAccountsInputSchema.parse({ query: request.query })

    const result = await accountsRepository.getAll(query.page, query.limit)

    formatSuccess(response, result, '200')
})

usersRouter.get('/me', requireAuth, async (request, response) => {
    const account = await accountsRepository.getOne(request.user!.id)

    if (!account) {
        throw new HttpError('Пользователь не найден', 404)
    }

    formatSuccess(response, account, '200')
})

usersRouter.post('/:id/profile', requireAuth, async (request, response) => {
    const input = createProfileInputSchema.parse({
        params: request.params,
        headers: request.headers,
        body: request.body,
    })

    if (input.params.id !== request.user!.id) {
        throw new HttpError('Недостаточно прав', 403)
    }

    const accountId = await accountsRepository.getId(input.params.id)

    if (!accountId) {
        throw new HttpError('Пользователь не найден', 404)
    }

    const profile = await accountsRepository.saveProfile(
        accountId,
        input.body.bio,
        input.body.avatar,
    )

    formatSuccess(response, profile, '200')
})
