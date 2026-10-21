import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ru } from 'zod/locales';

import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { usersRouter } from './routes/users.js';
import { errorHandler, logger } from './middleware/index.js';
import { ApiError } from './types.js';

z.config(ru());

const app = express();

app.disable('x-powered-by');
app.use(helmet({ frameguard: { action: 'deny' } }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
}));

app.use('/static', express.static(path.join(import.meta.dirname, '..', 'assets', 'uploads')));
app.use(logger);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);

app.use((_req, _res, next) => next(new ApiError('Ресурс не найден', 404)));
app.use(errorHandler);

app.listen(3000, () => {
  console.info('API успешно запущено на http://localhost:3000');
});