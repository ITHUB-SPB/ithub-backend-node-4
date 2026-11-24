import type { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import type { ErrorWithCode } from "../types.js"

declare global {
    namespace Express {
        interface Request {
            user?: { id: number; role: string }
        }
    }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    
    if (!authHeader) {
        const error = new Error('Unauthorized') as ErrorWithCode
        error.code = "401"
        return next(error)
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
        const error = new Error('Unauthorized') as ErrorWithCode
        error.code = "401"
        return next(error)
    }

    try {
        const payload = jwt.verify(token, process.env['JWT_ACCESS_SECRET']!) as { id: number; role: string }
        req.user = payload 
        next()
    } catch (err) {
        const error = new Error('Invalid token') as ErrorWithCode
        error.code = "401"
        next(error)
    }
}

export function requireRole(role: string) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            const error = new Error('Unauthorized') as ErrorWithCode
            error.code = "401"
            return next(error)
        }
        if (req.user.role !== role) {
            const error = new Error('Forbidden') as ErrorWithCode
            error.code = "403"
            return next(error)
        }
        next()
    }
}