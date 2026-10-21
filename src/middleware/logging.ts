import { Request, Response, NextFunction } from 'express';

export default function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.DEBUG === 'true') {
      console.info(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
}