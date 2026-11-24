import path from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import * as z from "zod"
import { ru } from "zod/locales"

import { productsRouter } from './routes/products.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js' 
import { logger, errorHandler } from './middleware/index.js'
import type { ErrorWithCode } from './types.js'

z.config(ru())

const app = express()

app.use(helmet()) 

app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser()) 

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(globalLimiter)

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, 
})
app.use('/api/auth', authLimiter)

app.use('/uploads', express.static(path.join(import.meta.dirname, '..', 'uploads')))

app.use(logger)

app.use('/api/products', productsRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

app.use((_request: express.Request, _response: express.Response, next: express.NextFunction) => {
    const error = new Error('Ресурс не найден') as ErrorWithCode
    error.code = "404"
    next(error)
})

app.use(errorHandler)

app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000')
})