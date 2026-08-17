import { z } from 'zod';

const dateTimeSchema = z.iso.datetime().transform(
  (date) => new Date(date)
);

const userFieldsSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.email('email must be a valid email'),
});

export const createUserSchema = z.object({
  body: userFieldsSchema,
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: userFieldsSchema,
});

export const patchUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: userFieldsSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'PATCH requires at least one field to update',
      }
    ),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const getUserByIdSchema = deleteUserSchema;

export const queryUserSchema = z.object({
  body: z
    .object({
      id: z.coerce.number().int().positive().optional(),
      name: z.string().min(1).optional(),
      email: z.email().optional(),
      createdAt: dateTimeSchema.optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'QUERY requires at least one query criterion',
      }
    ),
});