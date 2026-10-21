import { Request, Response, NextFunction } from 'express';
import { ZodError, treeifyError } from 'zod';
import { ApiError } from '../types.js';

export default function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({ success: false, error: 'Ошибка валидации данных', details: treeifyError(err) });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }

  const prismaCode = typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined;
  if (prismaCode === 'P2002') {
    res.status(409).json({ success: false, error: 'Запись с такими уникальными данными уже существует' });
    return;
  }

  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    success: false,
    error: process.env.DEBUG === 'true' && err instanceof Error ? err.message : 'Внутренняя ошибка сервера',
  });
}