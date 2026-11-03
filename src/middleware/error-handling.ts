import type {
    Request,
    Response,
    NextFunction
} from 'express'

import { ZodError, treeifyError } from 'zod'

import type { ErrorWithCode } from '../types.js'

export default function errorHandler(
    error: ErrorWithCode,
    _request: Request,
    response: Response,
    _next: NextFunction
): void {
    console.error('Ошибка:', error.message)

    if (error instanceof ZodError) {
        response.status(422).json({
            success: false,
            error: treeifyError(error)
        })

        return
    }

    if (error.message.includes('File too large')) {
        response.status(413).json({
            success: false,
            error: 'Размер файла не должен превышать 2 МБ'
        })

        return
    }

    let status = error.status ?? 500

    if (error.code === 'P2002') {
        status = 409
    }

    if (error.code === 'P2025') {
        status = 404
    }

    if (
        error.message.includes('Разрешены только JPEG и PNG')
    ) {
        status = 400
    }

    if (process.env['DEBUG']) {
        console.error(error.stack)
    }

    response.status(status).json({
        success: false,
        error: error.message || 'Внутренняя ошибка сервера'
    })
}