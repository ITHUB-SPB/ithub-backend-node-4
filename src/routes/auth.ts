import { Router } from 'express';
import { createTokens, getCookieValue, requireAuth, verifyRefreshToken, PasswordHelper } from '../auth.js';
import type { TokenPayload } from '../auth.js';
import { formatSuccess } from '../middleware/format-result.js';
import { accountsRepository } from '../repository/accounts.repository.js';
import { LoginSchema, RegisterSchema } from '../schemas/auth.schema.js';
import { ApiError } from '../types.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { body } = RegisterSchema.parse({ body: req.body });
  const hashedPassword = await PasswordHelper.hash(body.password);
  const account = await accountsRepository.add(body.email, hashedPassword);

  formatSuccess(res, account, 201);
});

authRouter.post('/login', async (req, res) => {
  const { body } = LoginSchema.parse({ body: req.body });
  const account = await accountsRepository.getByEmail(body.email);

  if (!account || !(await PasswordHelper.verify(body.password, account.password))) {
    throw new ApiError('Неверный email или пароль', 401);
  }

  const tokens = createTokens(account as TokenPayload); 
  res.cookie('refresh-token', tokens.refreshToken, cookieOptions);
  
  formatSuccess(res, { accessToken: tokens.accessToken });
});

authRouter.post('/refresh', (req, res) => {
  const refreshToken = getCookieValue(req, 'refresh-token');

  if (!refreshToken) {
    throw new ApiError('Отсутствует refresh token', 401);
  }

  const tokenUser = verifyRefreshToken(refreshToken);
  const newTokens = createTokens(tokenUser);

  res.cookie('refresh-token', newTokens.refreshToken, cookieOptions);
  formatSuccess(res, { accessToken: newTokens.accessToken });
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  res.clearCookie('refresh-token', { path: '/api/auth' });
  formatSuccess(res, {});
});