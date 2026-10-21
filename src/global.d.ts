import type { JwtPayload } from 'jsonwebtoken'

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			DATABASE_URL?: string
			ACCESS_TOKEN_SECRET?: string
			REFRESH_TOKEN_SECRET?: string
			DEBUG?: string
		}
	}

	namespace Express {
		interface Request {
			user?: JwtPayload & { id: number, role: 'user' | 'moderator', email: string }
		}
	}
}