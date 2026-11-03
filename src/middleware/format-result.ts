import type { Response } from 'express'

type SuccessCode = `2${number}${number}`

export function formatSuccess(
    response: Response,
    data: object,
    code: SuccessCode = '200'
): void {
    response.status(Number(code)).json({
        success: true,
        data
    })
}

export function formatError(
    response: Response,
    message: string,
    code: string = '400',
    details: object = {}
): void {
    const statusCode = Number(code)

    response.status(
        Number.isInteger(statusCode) &&
        statusCode >= 400 &&
        statusCode <= 599
            ? statusCode
            : 500
    ).json({
        success: false,
        error: message,
        details
    })
}