import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import multer from 'multer';

import { requireAuth } from '../auth.js';
import { formatSuccess } from '../middleware/format-result.js';
import { productsRepository } from '../repository/products.repository.js';
import { IdParamSchema } from '../schemas/common.schema.js';
import { CreateProductSchema, GetManyProductsSchema, UpdateProductSchema } from '../schemas/products.schema.js';
import { ApiError } from '../types.js';

import type { Request, Response, NextFunction } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'assets', 'uploads');

await mkdir(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError('Разрешены только файлы JPEG и PNG', 422));
    }
  },
});

export const productsRouter = Router();

productsRouter.get('/', async (req, res) => {
  const { query } = GetManyProductsSchema.parse({ query: req.query });
  const result = await productsRepository.getAll(query);

  formatSuccess(res, result);
});

productsRouter.get('/:id', requireAuth, async (req, res) => {
  const { id } = IdParamSchema.parse(req.params);
  const product = await productsRepository.getOne(id);

  if (!product) {
    throw new ApiError('Товар не найден', 404);
  }

  formatSuccess(res, product);
});

productsRouter.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const input = CreateProductSchema.parse({
    headers: req.headers,
    body: req.body,
  });

  const imageUrl = req.file ? `/static/${req.file.filename}` : null;
  const product = await productsRepository.add(input.body, req.user!.id, imageUrl);

  formatSuccess(res, product, 201);
});

productsRouter.patch('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const input = UpdateProductSchema.parse({
    params: req.params,
    headers: req.headers,
    body: req.body,
  });

  if (Object.keys(input.body).length === 0 && !req.file) {
    throw new ApiError('Не переданы поля для обновления', 422);
  }

  const ownerId = await productsRepository.getOwnerId(input.params.id);

  if (!ownerId) {
    throw new ApiError('Товар не найден', 404);
  }

  if (req.user!.role !== 'moderator' && ownerId !== req.user!.id) {
    throw new ApiError('Недостаточно прав', 403);
  }

  const imageUrl = req.file ? `/static/${req.file.filename}` : undefined;
  const product = await productsRepository.update(input.params.id, input.body, imageUrl);

  formatSuccess(res, product);
});

productsRouter.use((err: unknown, _req: Request, _res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError('Размер файла превышает 2 МБ', 422));
    }
    return next(new ApiError('Ошибка загрузки изображения', 422));
  }
  next(err);
});