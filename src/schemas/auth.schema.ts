import { z } from 'zod';
import { EmailSchema } from './common.schema.js';
import { CreateAccountSchema } from './accounts.schema.js';

export const RegisterSchema = CreateAccountSchema;

export const LoginSchema = z.object({
  body: z.object({
    email: EmailSchema,
    password: z.string().min(1).max(128),
  }),
});