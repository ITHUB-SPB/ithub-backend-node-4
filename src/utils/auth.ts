import crypto from 'node:crypto'
import type { AuthUser, TokenPayload } from '../types.js'

const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET']!
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET']!

// Создание токена
function createToken(
    user: AuthUser,
    type: 'access' | 'refresh',
    secret: string,
    expiresIn: number
): string {
    const header = Buffer.from(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    ).toString('base64url')

    const payload: TokenPayload = {
        sub: user.id,
        type,
        exp: Math.floor(Date.now() / 1000) + expiresIn
    }

    const body = Buffer.from(
        JSON.stringify(payload)
    ).toString('base64url')

    const data = `${header}.${body}`

    const signature = crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('base64url')

    return `${data}.${signature}`
}

// Создание access-токена
export function createAccessToken(user: AuthUser): string {
    return createToken(user, 'access', ACCESS_SECRET, 15 * 60)
}

// Создание refresh-токена
export function createRefreshToken(user: AuthUser): string {
    return createToken(user, 'refresh', REFRESH_SECRET, 7 * 24 * 60 * 60)
}

// Проверка токена
export function verifyToken(
    token: string,
    expectedType: 'access' | 'refresh'
): TokenPayload {
    const parts = token.split('.')

    if (parts.length !== 3) {
        throw new Error('Неверный токен')
    }

    const [header, body, signature] = parts

if (!header || !body || !signature) {
    throw new Error('Неверный формат токена')
}

    const secret = expectedType === 'access'
        ? ACCESS_SECRET
        : REFRESH_SECRET

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url')

    const actual = Buffer.from(signature, 'base64url')
    const expected = Buffer.from(expectedSignature, 'base64url')

    if (
        actual.length !== expected.length ||
        !crypto.timingSafeEqual(actual, expected)
    ) {
        throw new Error('Неверная подпись токена')
    }

    const payload = JSON.parse(
        Buffer.from(body, 'base64url').toString()
    ) as TokenPayload

    if (
        payload.type !== expectedType ||
        payload.exp < Math.floor(Date.now() / 1000)
    ) {
        throw new Error('Токен истёк или имеет неверный тип')
    }

    return payload
}