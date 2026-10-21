import { z } from 'zod';
import { AuthHeaderSchema, EmailSchema, IdParamSchema, PaginationSchema } from './common.schema.js';

export const CreateAccountSchema = z.object({
  body: z.object({
    email: EmailSchema,
    password: z.string().min(8).max(128),
  }),
});

export const GetManyAccountsSchema = z.object({
  query: PaginationSchema,
});

export const CreateProfileSchema = z.object({
  params: IdParamSchema,
  headers: z.object({ authorization: AuthHeaderSchema }),
  body: z.object({
    bio: z.string().trim().min(3).max(500),
    avatar: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.string().url().optional()
    ),
  }),
});
export const createAccountInputSchema = CreateAccountSchema;
export const createProfileInputSchema = CreateProfileSchema;