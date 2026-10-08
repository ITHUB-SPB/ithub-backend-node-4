import rateLimit from 'express-rate-limit'

export const globalRateLimit = rateLimit({
    limit: 100,
    windowMs: 1000 * 60,
    message: { message: 'Слишком много запросов', code: 429, details: 'Превышен лимит' }
})

export const authRateLimit = rateLimit({
    limit: 15,
    windowMs: 1000 * 60
})