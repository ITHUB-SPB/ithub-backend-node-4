import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'node:path'
import { mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import * as z from 'zod'

import { productsRepository } from '../repository/products.repository.js'
import { formatSuccess } from '../middleware/format-result.js'
import { authenticate } from '../middleware/authorize.js'

import {
    getManyProductsInputSchema,
    createProductInputSchema,
    updateProductInputSchema
} from '../schemas/products.schema.js'

export const productsRouter = Router()

// Папка для загруженных изображений
const uploadDir = path.join(import.meta.dirname, '../../assets/uploads')

mkdirSync(uploadDir, { recursive: true })

// Настройки загрузки изображений
const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,

        filename: (_request, file, callback) => {
            const extension = file.mimetype === 'image/png'
                ? '.png'
                : '.jpg'

            callback(null, randomUUID() + extension)
        }
    }),

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (_request, file, callback) => {
        if (
            file.mimetype !== 'image/jpeg' &&
            file.mimetype !== 'image/png'
        ) {
            callback(new Error('Разрешены только JPEG и PNG'))
            return
        }

        callback(null, true)
    }
})

// Получение всех товаров
productsRouter.get(
    '/',
    async (request: Request, response: Response) => {
        const input = getManyProductsInputSchema.parse(request)

        const result = await productsRepository.getAll(input)

        formatSuccess(response, result, '200')
    }
)

// Получение одного товара
productsRouter.get(
    '/:id',
    authenticate,
    async (request: Request, response: Response) => {
        const id = z.coerce.number().int().positive().parse(
            request.params['id']
        )

        const product = await productsRepository.getOne(id)

        if (!product) {
            const error = new Error('Товар не найден') as Error & {
                code?: string
            }

            error.code = '404'
            throw error
        }

        formatSuccess(response, { product }, '200')
    }
)

// Создание товара
productsRouter.post(
    '/',
    authenticate,
    upload.single('image'),
    async (request: Request, response: Response) => {
        const input = createProductInputSchema.parse({
            headers: request.headers,
            body: request.body
        })

        const imageUrl = request.file
            ? `/static/${request.file.filename}`
            : null

        const product = await productsRepository.add(
            input,
            imageUrl,
            request.user!.id
        )

        formatSuccess(response, { product }, '201')
    }
)

// Обновление товара
productsRouter.patch(
    '/:id',
    authenticate,
    upload.single('image'),
    async (request: Request, response: Response) => {
        const input = updateProductInputSchema.parse({
            headers: request.headers,
            params: request.params,
            body: request.body
        })

        const body: {
            name?: string
            price?: number
            category?: 'electronics' | 'clothing' | 'food' | 'other'
            description?: string | null
            imageUrl?: string
        } = {}

        if (input.body.name !== undefined) {
            body.name = input.body.name
        }

        if (input.body.price !== undefined) {
            body.price = input.body.price
        }

        if (input.body.category !== undefined) {
            body.category = input.body.category
        }

        if (input.body.description !== undefined) {
            body.description = input.body.description
        }

        if (request.file) {
            body.imageUrl = `/static/${request.file.filename}`
        }

        const product = await productsRepository.update(
            input.params.id,
            request.user!.id,
            request.user!.role === 'moderator',
            body
        )

        formatSuccess(response, { product }, '200')
    }
)