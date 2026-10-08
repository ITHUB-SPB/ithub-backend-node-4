import { type NextFunction, type Response } from "express"
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { type RequestWithAuth } from "../types.js"

export default function authenticate(request: RequestWithAuth, _response: Response, next: NextFunction) {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        return next(new Error('Отсутствует информация для аутентификации'))
    }

    const authString = authHeader.match(/Bearer (.*)/)
    const accessToken = authString?.at(1)

    if (!authString || !accessToken) {
        return next(new Error('Некорректный формат данных для аутентификации'))
    }

    const payload = jwt.verify(accessToken, process.env.JWT_SECRET) as JwtPayload

    // @ts-expect-error
    request.user = payload
    next()
}