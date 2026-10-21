import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/index.js';


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Критическая ошибка: не задан DATABASE_URL');
}

export const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: connectionString }),
});