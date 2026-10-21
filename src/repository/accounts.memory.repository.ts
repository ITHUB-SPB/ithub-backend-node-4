import type { IAccountsRepository } from './abstract.js';
import type { Prisma } from '../../generated/prisma/client.js';

type MemoryAccount = {
  id: number;
  email: string;
  password: string;
  role: 'user' | 'moderator';
  createdAt: Date;
};

type MemoryProfile = {
  id: number;
  accountId: number;
  bio: string;
  avatar: string | null;
};

export class InMemoryAccountsRepo implements IAccountsRepository {
  private accounts: MemoryAccount[] = [];
  private profiles: MemoryProfile[] = [];
  private idCounter = 1;

  async add(email: string, password: string) {
    const account: MemoryAccount = { id: this.idCounter++, email, password, role: 'user', createdAt: new Date() };
    this.accounts.push(account);
    return { id: account.id, email: account.email, role: account.role, createdAt: account.createdAt };
  }

  async getByEmail(email: string) {
    return this.accounts.find(a => a.email === email) || null;
  }

  async getAll(page: number, limit: number) {
    const total = this.accounts.length;
    const data = this.accounts
      .slice((page - 1) * limit, page * limit)
      .map(a => ({ 
        id: a.id, email: a.email, role: a.role, createdAt: a.createdAt, 
        profile: this.profiles.find(p => p.accountId === a.id) || null 
      }));
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getOne(id: number) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) return null;
    return {
      id: account.id, email: account.email, role: account.role, createdAt: account.createdAt,
      profile: this.profiles.find(p => p.accountId === id) || null,
      products: [], 
    } as unknown as Prisma.AccountGetPayload<{ include: { profile: true, products: true } }>;
  }

  async getId(id: number) {
    return this.accounts.find(a => a.id === id)?.id ?? null;
  }

  async saveProfile(id: number, bio: string, avatar?: string) {
    let profile = this.profiles.find(p => p.accountId === id);
    if (!profile) {
      profile = { id: this.profiles.length + 1, accountId: id, bio, avatar: avatar || null };
      this.profiles.push(profile);
    } else {
      profile.bio = bio;
      if (avatar !== undefined) profile.avatar = avatar;
    }
    return profile as unknown as Prisma.ProfileGetPayload<object>;
  }
}