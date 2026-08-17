import { z } from 'zod';

const dateTimeSchema = z.iso.datetime().transform(
  (date) => new Date(date)
);

const loanFieldsSchema = z.object({
  userId: z.number().int().positive(),
  bookId: z.number().int().positive(),
  borrowedAt: dateTimeSchema,
  dueDate: dateTimeSchema,
  returnedAt: dateTimeSchema.nullable(),
});

const loanDateValuesSchema = z.object({
  userId: z.number().int().positive(),
  bookId: z.number().int().positive(),
  borrowedAt: z.date(),
  dueDate: z.date(),
  returnedAt: z.date().nullable(),
}).superRefine((data, ctx) => {
  if (data.dueDate < data.borrowedAt) {
    ctx.addIssue({
      code: 'custom',
      path: ['dueDate'],
      message: 'dueDate cannot be before borrowedAt',
    });
  }

  if (
    data.returnedAt !== null &&
    data.returnedAt < data.borrowedAt
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['returnedAt'],
      message: 'returnedAt cannot be before borrowedAt',
    });
  }
});

export const createLoanSchema = z.object({
  body: z
    .object({
      userId: z.number().int().positive(),
      bookId: z.number().int().positive(),
      borrowedAt: dateTimeSchema.default(() => new Date()),
      dueDate: dateTimeSchema,
      returnedAt: dateTimeSchema.nullable().default(null),
    })
    .superRefine((data, ctx) => {
      if (data.dueDate < data.borrowedAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['dueDate'],
          message: 'dueDate cannot be before borrowedAt',
        });
      }

      if (
        data.returnedAt !== null &&
        data.returnedAt < data.borrowedAt
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['returnedAt'],
          message: 'returnedAt cannot be before borrowedAt',
        });
      }
    }),
});

export const updateLoanSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: loanFieldsSchema.superRefine((data, ctx) => {
    if (data.dueDate < data.borrowedAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['dueDate'],
        message: 'dueDate cannot be before borrowedAt',
      });
    }

    if (
      data.returnedAt !== null &&
      data.returnedAt < data.borrowedAt
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['returnedAt'],
        message: 'returnedAt cannot be before borrowedAt',
      });
    }
  }),
});

export const patchLoanSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: loanFieldsSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'PATCH requires at least one field to update',
      }
    ),
});

export const getLoanByIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const deleteLoanSchema = getLoanByIdSchema;

export const queryLoanSchema = z.object({
  body: z
    .object({
      id: z.number().int().positive().optional(),
      userId: z.number().int().positive().optional(),
      bookId: z.number().int().positive().optional(),
      borrowedAt: dateTimeSchema.optional(),
      dueDate: dateTimeSchema.optional(),
      returnedAt: dateTimeSchema.nullable().optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'QUERY requires at least one query criterion',
      }
    ),
});

export const validateLoanDatesSchema = loanDateValuesSchema;