import { z } from 'zod';

const bookFieldsSchema = z.object({
  title: z.string().min(1, 'title is required'),
  author: z.string().min(1, 'author is required'),
  isbn: z.string().min(1, 'isbn is required'),
  publishedAt: z.iso.date().transform(
  (date) => new Date(`${date}T00:00:00.000Z`)
)
});

export const createBookSchema = z.object({
  body: bookFieldsSchema,
});

export const updateBookSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: bookFieldsSchema,
});

export const patchBookSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: bookFieldsSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'PATCH requires at least one field to update',
      }
    ),
});

export const getBookByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const deleteBookSchema = getBookByIdSchema;

export const queryBookSchema = z.object({
  body: z
    .object({
      id: z.coerce.number().int().positive().optional(),
      title: z.string().min(1).optional(),
      author: z.string().min(1).optional(),
      isbn: z.string().min(1).optional(),
      publishedAt: z.iso.date()
        .transform((date) => new Date(`${date}T00:00:00.000Z`))
        .optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'QUERY requires at least one query criterion',
      }
    ),
});