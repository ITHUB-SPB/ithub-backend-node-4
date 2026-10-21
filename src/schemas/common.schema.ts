import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const AuthHeaderSchema = z.string().regex(/^Bearer\s+.+$/i, 'Ожидается Bearer токен');

export const EmailSchema = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim() : v),
  z.string().email('Некорректный email')
);