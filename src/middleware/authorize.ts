import { type NextFunction, type Response } from "express"
import { type RequestWithAuth } from "../types.js"

export default function authorize(request: RequestWithAuth, response: Response, next: NextFunction) {
    const role = request.user!.role

    if (role !== 'moderator') {
        next(new Error('Недостаточно прав'))
    }

    next()
}