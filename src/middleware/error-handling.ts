import type { Request, Response, NextFunction } from "express"
import { treeifyError, ZodError } from "zod"
import { Prisma } from "../../generated/prisma/client.js"
import type { ErrorWithCode } from "../types.js"

export default function (error: ErrorWithCode, _: Request, response: Response, next: NextFunction): void {
    console.error(error)

    if (error instanceof ZodError) {
        response.status(422).json({
            success: false,
            error: treeifyError(error)
        })
        return
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            response.status(409).json({
                success: false,
                error: "Unique constraint failed"
            })
        }
        return
    }

    if (process.env['DEBUG']) {
        console.error(error.stack)
    }

    response.status(Number(error.code || "400")).json({
        success: false,
        error: error.message
    })

    next()
}