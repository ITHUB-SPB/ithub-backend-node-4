import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL?: string;
      ACCESS_TOKEN_SECRET?: string;
      REFRESH_TOKEN_SECRET?: string;
      DEBUG?: string;
      CORS_ORIGIN?: string;
      NODE_ENV?: 'development' | 'production';
    }
  }

  namespace Express {
    interface Request {
      user?: JwtPayload & {
        id: number;
        role: 'user' | 'moderator';
        email: string;
      };
    }
  }
}
export {};