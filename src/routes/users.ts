import { Router } from 'express';
import { requireAuth, requireModerator } from '../auth.js';
import { formatSuccess } from '../middleware/format-result.js';
import { accountsRepository } from '../repository/accounts.repository.js';
import { CreateProfileSchema, GetManyAccountsSchema } from '../schemas/accounts.schema.js';
import { ApiError } from '../types.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, requireModerator, async (req, res) => {
  const { query } = GetManyAccountsSchema.parse({ query: req.query });
  const result = await accountsRepository.getAll(query.page, query.limit);

  formatSuccess(res, result);
});

usersRouter.get('/me', requireAuth, async (req, res) => {
  const account = await accountsRepository.getOne(req.user!.id);

  if (!account) {
    throw new ApiError('Пользователь не найден', 404);
  }

  formatSuccess(res, account);
});

usersRouter.post('/:id/profile', requireAuth, async (req, res) => {
  const input = CreateProfileSchema.parse({
    params: req.params,
    headers: req.headers,
    body: req.body,
  });

  if (input.params.id !== req.user!.id) {
    throw new ApiError('Можно редактировать только свой профиль', 403);
  }

  const accountId = await accountsRepository.getId(input.params.id);

  if (!accountId) {
    throw new ApiError('Пользователь не найден', 404);
  }

  const profile = await accountsRepository.saveProfile(
    accountId,
    input.body.bio,
    input.body.avatar
  );

  formatSuccess(res, profile);
});