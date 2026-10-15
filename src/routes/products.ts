import { Router, type Request, type Response } from "express"
import * as z from 'zod'

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess } from "../middleware/format-result.js"
import { getProductsInputSchema, getProductsWithMetaOutputSchema } from '../schemas/products.schema.js'

export const productsRouter = Router()

productsRouter.get('/', async (request: Request, response: Response) => {
    const input = z.parse(getProductsInputSchema, request)
    const { data, meta } = await productsRepository.getAll(input)

    const responseData = getProductsWithMetaOutputSchema.parse({
        data,
        meta 
    })

    console.log(responseData)

    formatSuccess(response, responseData, "200")
})