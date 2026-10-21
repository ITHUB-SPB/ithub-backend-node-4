import type { Request, Response, NextFunction } from 'express'
import { treeifyError, ZodError } from 'zod'
import { HttpError } from '../types.js'

export default function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
    if (error instanceof ZodError) {
        response.status(422).json({ success: false, error: 'Некорректные входные данные', details: treeifyError(error) })
        return
    }
    if (error instanceof HttpError) {
        response.status(error.status).json({ success: false, error: error.message })
        return
    }
    const prismaCode = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
    if (prismaCode === 'P2002') {
        response.status(409).json({ success: false, error: 'Запись с такими данными уже существует' })
        return
    }
    console.error(error)
    response.status(500).json({
        success: false,
        error: process.env.DEBUG === 'true' && error instanceof Error ? error.message : 'Внутренняя ошибка сервера',
    })
}
