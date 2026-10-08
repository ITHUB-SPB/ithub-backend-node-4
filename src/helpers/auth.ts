import { scrypt } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { RequestAuth } from '../types.js'

export const hashPassword = (password: string): Promise<string> => new Promise((resolve, reject) => {
    scrypt(password, process.env.SALT, 32, (error, result) => {
        if (error) {
            reject(error)
        }
        resolve(result.toString('hex'))
    })
})

export const generateTokens = (payload: NonNullable<RequestAuth['user']>) => {
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    )

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
    )

    return { accessToken, refreshToken }
}