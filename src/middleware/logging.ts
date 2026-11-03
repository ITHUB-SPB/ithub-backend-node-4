import type {
    Request,
    Response,
    NextFunction
} from 'express'

export default function (
    request: Request,
    response: Response,
    next: NextFunction
): void {
    const startTime = Date.now()

    response.on('finish', () => {
        const duration = Date.now() - startTime

        console.info(
            `[${duration} ms] ${request.method} ${request.url} ${response.statusCode}`
        )

        if (process.env['DEBUG']) {
            console.info({
                params: request.params,
                query: request.query
            })
        }
    })

    next()
}