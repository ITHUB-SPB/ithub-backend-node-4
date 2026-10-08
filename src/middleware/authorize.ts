import { type NextFunction, type Response } from "express"
import { type RequestWithAuth } from "../types.js"

type Operation = 'delete' | 'create' | 'edit' | 'read'
type Scope = 'any' | 'own'
type Resource = 'users' | 'products'

type Permission = `${Operation}:${Scope}:${Resource}`

type Rules = {
    user?: Permission[],
    moderator?: Permission[]
}

export default function authorize(rules: Rules) {

    return (request: RequestWithAuth, response: Response, next: NextFunction) {
        const role = request.user!.role

        if (role !== 'moderator') {
            next(new Error('Недостаточно прав'))
        }

        next()
    }
}

