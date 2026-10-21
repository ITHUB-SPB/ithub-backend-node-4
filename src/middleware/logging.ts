import type { Request, Response, NextFunction } from 'express'

export default function logger(request: Request, response: Response, next: NextFunction): void {
    const startTime = Date.now()
    response.on('finish', () => {
        if (process.env.DEBUG === 'true') console.info(`${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startTime}ms`)
    })
    next()
}
