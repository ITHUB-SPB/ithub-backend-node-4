import * as z from 'zod'
import type { Request } from 'express';

import { Prisma } from "../generated/prisma/client.js"
import { metaSchema } from "./schemas/common.schema.js";

export type ErrorWithCode = Error & { code?: `${4 | 5}${number}${number}` | Prisma.PrismaClientKnownRequestError['code'] }

export type BaseEntity = {
    id: string | number;
}

export type DataWithMeta<T> = {
    data: Partial<T>[],
    meta: z.infer<typeof metaSchema>
}

export type RequestWithAuth = Request & { user?: { email: string, role: "user" | "moderator" } }