
import path from 'node:path'
import express from 'express'
import * as z from 'zod'
import { ru } from 'zod/locales'

import { productsRouter } from './routes/products.js'
import authRouter from './routes/auth.js'
import { usersRouter } from './routes/users.js'

import {
    logger,
    errorHandler
} from './middleware/index.js'

import type { ErrorWithCode } from './types.js'

import './workers/email.worker.js'

import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { emailQueue } from '../queues/email.queue.js'

z.config(ru())

const app = express()

// Настройка Bull Board
const serverAdapter = new ExpressAdapter()

serverAdapter.setBasePath('/admin/queues')

createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter
})

// Ограничение размера тела запроса
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({
    extended: true,
    limit: '10kb'
}))

// Защита HTTP-заголовков
app.disable('x-powered-by')

app.use((_request, response, next) => {
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')

    next()
})

// Логирование
app.use(logger)

// Статические изображения
app.use(
    '/static',
    express.static(path.resolve('assets/uploads'))
)

// Основные маршруты
app.use('/api/products', productsRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

// Панель управления очередями
app.use('/admin/queues', serverAdapter.getRouter())

// Обработка неизвестных маршрутов
app.use((
    _request: express.Request,
    _response: express.Response,
    next: express.NextFunction
) => {
    const error = new Error('Ресурс не найден') as ErrorWithCode

    error.status = 404

    next(error)
})

// Обработка ошибок
app.use(errorHandler)

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000')
})
