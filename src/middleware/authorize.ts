import { type NextFunction, type Response } from "express"
import { type RequestWithAuth } from "../types.js"

type Operation = 'delete' | 'create' | 'edit' | 'read'
type Scope = 'any' | 'own'
type Resource = 'accounts' // TODO добавить products

type Permission = `${Operation}:${Scope}:${Resource}`

type Role = 'user' | 'moderator' | 'guest'

type Rules = {
    user?: Permission[],
    moderator?: Permission[],
    guest?: Permission[]
}

type Permissions = Record<Permission, Role[]>

const PERMISSIONS: Permissions = {
    'create:any:accounts': ['moderator', 'guest'],
    'edit:any:accounts': ['moderator'],
    'read:any:accounts': ['moderator'],
    'delete:any:accounts': ['moderator'],

    'create:own:accounts': [],
    'edit:own:accounts': ['moderator', 'user'],
    'read:own:accounts': ['moderator', 'user'],
    'delete:own:accounts': ['moderator', 'user'],
}

export default function authorize(rules: Rules) {
    return (request: RequestWithAuth, response: Response, next: NextFunction) {
        const role = request.user!.role
        const roleRules = rules[role]

        const hasRights = roleRules?.every(rule => PERMISSIONS[rule].includes(role))

        if (!hasRights) {
            next(new Error('Недостаточно прав'))
        }

        next()
    }
}

