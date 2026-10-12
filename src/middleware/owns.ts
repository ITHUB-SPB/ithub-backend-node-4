import { type NextFunction, type Response } from "express"
import * as z from "zod";
import { prisma } from '../prisma.js'
import { type RequestWithAuth } from "../types.js"
import { loginUserSchema } from "../schemas/auth.schema.js"

type Resource = 'account' // TODO добавить products

const accountFieldsSchema = loginUserSchema.pick({ email: true })
type AccountFields = keyof z.infer<typeof accountFieldsSchema>
// создать аналогичные схему и тип для уникальных ключей продукта

const accountOwnerFieldsSchema = loginUserSchema.pick({ email: true })
type AccountOwnerFields = keyof z.infer<typeof accountOwnerFieldsSchema>
// создать аналогичные схему и тип для внешних ключей продукта

type Fields = AccountFields // добавить также поля продукта
type OwnerFields = AccountOwnerFields // добавить также внешние поля продукта

export default function owns(resource: Resource, field: Fields, ownerField: OwnerFields) {
    return async (request: RequestWithAuth, _response: Response, next: NextFunction) => {
        const role = request.user!.role

        if (role === "moderator") {
            next()
        }

        const paramsField = request.params[field] as string

        const record = await prisma[resource].findUnique({
            where: {
                [field]: paramsField
            }
        })

        const hasRights = record && record[ownerField] === request.user!.email

        if (!hasRights) {
            next(new Error('Недостаточно прав'))
        }

        next()
    }
}

