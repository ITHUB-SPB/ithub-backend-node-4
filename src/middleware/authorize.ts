import { type NextFunction, type Response } from "express"
import { type RequestWithAuth } from "../types.js"

type Operation = 'delete' | 'create' | 'edit' | 'read'
type Resource = 'account' // TODO добавить products

type Permission = `${Operation}:${Resource}`
type Role = 'user' | 'moderator' | 'guest'

type Permissions = Record<Permission, Role[]>

const PERMISSIONS: Permissions = {
    'create:account': ['moderator', 'guest'],
    'edit:account': ['moderator'],
    'read:account': ['moderator'],
    'delete:account': ['moderator'],
}

export default function authorize(rule: Permission) {
    return (request: RequestWithAuth, response: Response, next: NextFunction) => {
        const role = request.user!.role
        const hasRights = PERMISSIONS[rule].includes(role)

        if (!hasRights) {
            next(new Error('Недостаточно прав'))
        }

        next()
    }
}

