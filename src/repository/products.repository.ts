import type { Prisma } from '../../generated/prisma/index.js';
import { db } from '../prisma.js';
import type { CreateProductBody, GetProductsQuery, UpdateProductBody } from '../schemas/products.schema.js';
import type { IProductsRepository, ProductDetails } from './abstract.js';

class PrismaProductsRepo implements IProductsRepository {
  async getAll(query: GetProductsQuery) {
    const where: Prisma.ProductWhereInput = { archived: false };
    
    if (query.category) where.category = query.category;
    if (query.creator) where.account = { email: query.creator };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = { gte: query.minPrice, lte: query.maxPrice };
    }

    const [total, items] = await db.$transaction([
      db.product.count({ where }),
      db.product.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { account: { select: { email: true } } },
      }),
    ]);

    const data = items.map(({ account, ...rest }) => ({ ...rest, email: account.email }));
    
    return {
      data,
      meta: { total, page: query.page, limit: query.limit, pages: Math.ceil(total / query.limit) },
    };
  }

  async getOne(id: number) {
    const item = await db.product.findUnique({
      where: { id },
      include: {
        account: {
          select: { email: true, profile: { select: { bio: true, avatar: true } } },
        },
      },
    });

    if (!item) return null;
    const { account, ...rest } = item;
    return { ...rest, email: account.email, profile: account.profile } as ProductDetails;
  }

  async getOwnerId(id: number) {
    const product = await db.product.findUnique({ where: { id }, select: { accountId: true } });
    return product?.accountId ?? null;
  }

  async add(data: CreateProductBody, accountId: number, imageUrl: string | null) {
    const product = await db.product.create({
      data: { ...data, accountId, imageUrl },
      include: { account: { select: { email: true } } },
    });
    const { account, ...rest } = product;
    return { ...rest, email: account.email };
  }

  async update(id: number, data: UpdateProductBody, imageUrl?: string) {
    const product = await db.product.update({
      where: { id },
      data: { ...data, ...(imageUrl !== undefined && { imageUrl }) },
      include: { account: { select: { email: true } } },
    });
    const { account, ...rest } = product;
    return { ...rest, email: account.email };
  }
}

export const productsRepository = new PrismaProductsRepo();