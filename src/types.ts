import * as z from 'zod'
import { metaSchema } from './schemas/common.schema.js'

export type ErrorWithCode = Error & {
    code?: string
    status?: number
}

export type BaseEntity = {
    id: string | number
}

export type DataWithMeta<T> = {
    data: Partial<T>[]
    meta: z.infer<typeof metaSchema>
}

export type AuthUser = {
    id: number
    email: string
    role: 'user' | 'moderator'
}

export type TokenPayload = {
    sub: number
    type: 'access' | 'refresh'
    exp: number
}