import { db } from '../prisma.js';
import type { IAccountsRepository } from './abstract.js';

class PrismaAccountsRepo implements IAccountsRepository {
  async add(email: string, password: string) {
    return db.account.create({
      data: { email, password },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  async getByEmail(email: string) {
    return db.account.findUnique({ where: { email } });
  }

  async getAll(page: number, limit: number) {
    const [total, items] = await db.$transaction([
      db.account.count(),
      db.account.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, role: true, createdAt: true,
          profile: { select: { id: true, bio: true, avatar: true } },
        },
      }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getOne(id: number) {
    return db.account.findUnique({
      where: { id },
      select: {
        id: true, email: true, role: true, createdAt: true,
        profile: { select: { id: true, bio: true, avatar: true } },
        products: true,
      },
    });
  }

  async getId(id: number) {
    const acc = await db.account.findUnique({ where: { id }, select: { id: true } });
    return acc?.id ?? null;
  }

  async saveProfile(id: number, bio: string, avatar?: string) {
    return db.profile.upsert({
      where: { accountId: id },
      create: { bio, avatar, accountId: id },
      update: { bio, ...(avatar !== undefined && { avatar }) },
    });
  }
}

export const accountsRepository = new PrismaAccountsRepo();