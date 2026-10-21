import type { GetProductsQuery, CreateProductBody, UpdateProductBody } from '../schemas/products.schema.js';
import type { PaginatedResponse } from '../types.js';
import type { Prisma } from '../../generated/prisma/client.js';

export type ProductWithEmail = Prisma.ProductGetPayload<{
  include: { account: { select: { email: true } } }
}> & { email: string };

export type ProductDetails = Prisma.ProductGetPayload<{
  include: {
    account: {
      select: {
        email: true;
        profile: { select: { bio: true; avatar: true } };
      };
    };
  };
}> & { email: string; profile: { bio: string; avatar: string | null } | null };

export interface IProductsRepository {
  getAll(query: GetProductsQuery): Promise<PaginatedResponse<ProductWithEmail>>;
  getOne(id: number): Promise<ProductDetails | null>;
  getOwnerId(id: number): Promise<number | null>;
  add(data: CreateProductBody, accountId: number, imageUrl: string | null): Promise<ProductWithEmail>;
  update(id: number, data: UpdateProductBody, imageUrl?: string): Promise<ProductWithEmail>;
}

export interface IAccountsRepository {
  add(email: string, password: string): Promise<Prisma.AccountGetPayload<{ select: { id: true, email: true, role: true, createdAt: true } }>>;
  getByEmail(email: string): Promise<Prisma.AccountGetPayload<object> | null>;
  getAll(page: number, limit: number): Promise<PaginatedResponse<Prisma.AccountGetPayload<{ include: { profile: true } }>>>;
  getOne(id: number): Promise<Prisma.AccountGetPayload<{ include: { profile: true, products: true } }> | null>;
  getId(id: number): Promise<number | null>;
  saveProfile(id: number, bio: string, avatar?: string): Promise<Prisma.ProfileGetPayload<object>>;
}