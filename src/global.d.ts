declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEBUG?: boolean
            SALT: string
            DATABASE_URL?: string
            JWT_SECRET: string
        }
    }
}

export { }