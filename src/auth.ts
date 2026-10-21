import 'dotenv/config';
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import type { Request, RequestHandler } from 'express';
import { ApiError } from './types.js';

const scryptAsync = promisify(scryptCb);

const accessSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

if (!accessSecret || !refreshSecret) {
  throw new Error('Секретные ключи JWT не заданы в .env');
}

export type TokenPayload = {
  id: number;
  email: string;
  role: 'user' | 'moderator';
};

export class PasswordHelper {
  static async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  static async verify(password: string, storedHash: string): Promise<boolean> {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    const expectedKey = Buffer.from(key, 'hex');
    
    return derivedKey.length === expectedKey.length && timingSafeEqual(derivedKey, expectedKey);
  }
}

export function createTokens(payload: TokenPayload) {
  return {
    accessToken: jwt.sign(payload, accessSecret, { expiresIn: '15m' }),
    refreshToken: jwt.sign(payload, refreshSecret, { expiresIn: '7d' }),
  };
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, refreshSecret) as TokenPayload;
  } catch {
    throw new ApiError('Недействительный refresh token', 401);
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError('Требуется заголовок Authorization', 401));
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, accessSecret) as JwtPayload & TokenPayload;
    next();
  } catch {
    next(new ApiError('Невалидный или просроченный токен', 401));
  }
};

export const requireModerator: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'moderator') {
    return next(new ApiError('Доступ запрещен. Нужны права модератора', 403));
  }
  next();
};

export function getCookieValue(req: Request, name: string): string | undefined {
  const cookies = req.headers.cookie?.split(';') || [];
  const match = cookies.find((c) => c.trim().startsWith(`${name}=`));
  return match ? match.trim().slice(name.length + 1) : undefined;
}