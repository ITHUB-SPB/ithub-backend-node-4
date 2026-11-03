import type {
    Request,
    Response,
    NextFunction
} from 'express'
import { verifyToken } from '../utils/auth.js'
import { prisma } from '../prisma.js'

export async function authenticate(
    request: Request,
    response: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authorization = request.headers.authorization

        if (!authorization?.startsWith('Bearer ')) {
            response.status(401).json({
                success: false,
                error: 'Требуется авторизация'
            })
            return
        }

        const token = authorization.slice(7)
        const payload = verifyToken(token, 'access')

        const account = await prisma.account.findUnique({
            where: {
                id: payload.sub
            },
            select: {
                id: true,
                email: true,
                role: true
            }
        })

        if (!account) {
            response.status(401).json({
                success: false,
                error: 'Пользователь не найден'
            })
            return
        }

        request.user = account

        next()
    } catch {
        response.status(401).json({
            success: false,
            error: 'Недействительный токен'
        })
    }
}

export function moderatorOnly(
    request: Request,
    response: Response,
    next: NextFunction
): void {
    if (request.user?.role !== 'moderator') {
        response.status(403).json({
            success: false,
            error: 'Недостаточно прав'
        })
        return
    }

    next()
}