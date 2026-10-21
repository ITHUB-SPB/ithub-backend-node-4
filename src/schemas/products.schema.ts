import { z } from 'zod';
import { AuthHeaderSchema, EmailSchema, IdParamSchema, PaginationSchema } from './common.schema.js';

export const CategoryEnum = z.enum(['electronics', 'clothing', 'food', 'other']);

const ProductBaseFields = z.object({
  name: z.string().trim().min(2).max(100),
  price: z.coerce.number().positive(),
  category: CategoryEnum,
  description: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().trim().max(500).optional()
  ),
});

export const GetManyProductsSchema = z.object({
  query: PaginationSchema.extend({
    category: CategoryEnum.optional(),
    creator: EmailSchema.optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
  }).refine(
    (data) => !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
    { message: 'minPrice не должен превышать maxPrice', path: ['minPrice'] }
  ),
});

export const CreateProductSchema = z.object({
  headers: z.object({ authorization: AuthHeaderSchema }),
  body: ProductBaseFields,
});

export const UpdateProductSchema = z.object({
  params: IdParamSchema,
  headers: z.object({ authorization: AuthHeaderSchema }),
  body: ProductBaseFields.partial(),
});

export type GetProductsQuery = z.infer<typeof GetManyProductsSchema>['query'];
export type CreateProductBody = z.infer<typeof CreateProductSchema>['body'];
export type UpdateProductBody = z.infer<typeof UpdateProductSchema>['body'];
export const getManyProductsInputSchema = GetManyProductsSchema;
export const updateProductInputSchema = UpdateProductSchema;
export const createProductInputSchema = CreateProductSchema;