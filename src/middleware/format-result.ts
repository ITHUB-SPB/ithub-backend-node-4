import { Response } from 'express';

export function formatSuccess(res: Response, data: unknown, statusCode: number = 200) {
  res.status(statusCode).json({ success: true, data });
}