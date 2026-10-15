import path from 'node:path'
import express from 'express'
import * as z from "zod"
import { ru } from "zod/locales"

import { productsRouter } from './routes/products.js'
import { logger, errorHandler } from './middleware/index.js'
import type { ErrorWithCode } from './types.js'
import helmet from "helmet"
z.config(ru())

const app = express()
app.disable('x-powered-by');
app.use(helmet({ frameguard: false }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static', express.static(path.join(import.meta.dirname, '..', 'assets', 'uploads')))

app.use(logger)

app.use('api/products', productsRouter)

app.use((_request: express.Request, _response: express.Response, next: express.NextFunction) => {
    const error = new Error('Ресурс не найден') as ErrorWithCode
    error.code = "404"

    next(error)
})


app.use(errorHandler)

app.listen(3000)