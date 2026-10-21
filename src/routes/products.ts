import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import multer from "multer"

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess } from "../middleware/format-result.js"
import { getProductOutputSchema, createProductInputSchema, getManyProductsInputSchema, getProductsWithMetaOutputSchema } from '../schemas/products.schema.js'

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true)
        } else {
            cb(new Error('INVALID_FILE_TYPE'))
        }
    }
})

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

productsRouter.post('/', upload.single('image'), async (request: Request, response: Response, next) => {
    try {
        const input = z.parse(createProductInputSchema, request)
        
        let imageUrl: string | null = null
        if (request.file) {
            imageUrl = `https://storage.local{Date.now()}-${request.file.originalname}`
        }

        const recordWithImage = {
            ...input,
            imageUrl
        }

        const createdProduct = await productsRepository.add(recordWithImage)
        const responseData = getProductOutputSchema.parse(createdProduct)

        formatSuccess(response, responseData, "201")
    } catch (error) {
        next(error)
    }
})

productsRouter.patch('/:id', upload.single('image'), async (request: Request, response: Response, next) => {
    try {
        const { id } = request.params
        const email = request.headers['authorization'] as string

        if (!email) {
            return response.status(401).json({ error: "Unauthorized: Missing Authorization header" })
        }

        const updateFields: any = { ...request.body }
        if (updateFields.price) {
            updateFields.price = Number(updateFields.price)
        }

        if (request.file) {
            updateFields.imageUrl = `https://storage.local{Date.now()}-${request.file.originalname}`
        }

        const updatedProduct = await (productsRepository as any).update(id, email, updateFields)
        
        const responseData = getProductOutputSchema.parse(updatedProduct)
        formatSuccess(response, responseData, "200")
    } catch (error: any) {
        if (error.message === 'Forbidden') {
            response.status(403).json({ error: "Forbidden: You are not the owner of this product" })
        } else if (error.message === 'Record not found') {
            response.status(404).json({ error: error.message })
        } else {
            next(error)
        }
    }
})