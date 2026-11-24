import { Router, type Request, type Response } from "express"
import * as z from 'zod'
import jwt from 'jsonwebtoken'

import { accountsRepository } from '../repository/accounts.repository.js'
import { formatSuccess } from '../middleware/format-result.js'
import { createAccountInputSchema, loginInputSchema } from '../schemas/accounts.schema.js'
import type { ErrorWithCode } from '../types.js'

export const authRouter = Router()

const generateTokens = (accountId: number, role: string) => {
    const accessToken = jwt.sign(
        { id: accountId, role }, 
        process.env['JWT_ACCESS_SECRET']!, 
        { expiresIn: '15m' }
    )
    const refreshToken = jwt.sign(
        { id: accountId }, 
        process.env['JWT_REFRESH_SECRET']!, 
        { expiresIn: '7d' } 
    )
    return { accessToken, refreshToken }
}

authRouter.post('/register', async (request: Request, response: Response) => {
    const input = z.parse(createAccountInputSchema, request)
    
    const account = await accountsRepository.create(input.body)
    
    formatSuccess(response, account, "201")
})

authRouter.post('/login', async (request: Request, response: Response) => {
    const input = z.parse(loginInputSchema, request)
    
    const account = await accountsRepository.findByEmail(input.body.email)
    if (!account) {
        const error = new Error('Invalid credentials') as ErrorWithCode
        error.code = "401"
        throw error
    }

    const isValid = await accountsRepository.validatePassword(input.body.password, account.password)
    if (!isValid) {
        const error = new Error('Invalid credentials') as ErrorWithCode
        error.code = "401"
        throw error
    }

    const { accessToken, refreshToken } = generateTokens(account.id, account.role)

    response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    })

    formatSuccess(response, { accessToken }, "200")
})

authRouter.post('/refresh', async (request: Request, response: Response) => {
    const refreshToken = request.cookies['refreshToken']
    
    if (!refreshToken) {
        const error = new Error('Refresh token not found') as ErrorWithCode
        error.code = "401"
        throw error
    }

    try {
        const payload = jwt.verify(refreshToken, process.env['JWT_REFRESH_SECRET']!) as { id: number }
        
        const account = await accountsRepository.getMe(payload.id)
        if (!account) {
            const error = new Error('Account not found') as ErrorWithCode
            error.code = "401"
            throw error
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(account.id, account.role)

        response.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        formatSuccess(response, { accessToken }, "200")
    } catch (error) {
        const err = new Error('Invalid refresh token') as ErrorWithCode
        err.code = "401"
        throw err
    }
})

authRouter.post('/logout', (_request: Request, response: Response) => {
    response.clearCookie('refreshToken')
    formatSuccess(response, { message: 'Logged out' }, "200")
})