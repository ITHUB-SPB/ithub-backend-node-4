import { Router, type Request, type Response } from "express"
import * as z from 'zod'

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess } from "../middleware/format-result.js"
import { getProductsInputSchema, getManyProductsInputSchema, getProductsWithMetaOutputSchema } from '../schemas/products.schema.js'

export const productsRouter = Router()

productsRouter.get('/', async (request: Request, response: Response, next) => {
    try {
        const input = z.parse(getManyProductsInputSchema, request) 
        const { data, meta } = await productsRepository.getAll(input)

        const responseData = getProductsWithMetaOutputSchema.parse({ data, meta })
        console.log(responseData)

        formatSuccess(response, responseData, "200")
    } catch (error) {
        next(error)
    }
})