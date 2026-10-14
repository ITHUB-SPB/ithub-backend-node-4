declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEBUG?: boolean
            DATABASE_URL?: string
        }
    }
}

export { }