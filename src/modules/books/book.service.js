import { prisma } from '../../config/prisma.js';

export const createBook = async ({
  title,
  author,
  isbn,
  publishedAt,
}) => {
  return await prisma.book.create({
    data: {
      title,
      author,
      isbn,
      publishedAt,
    },
  });
};

export const getBooks = async () => {
  return await prisma.book.findMany();
};

export const getBookById = async (id) => {
  return await prisma.book.findUnique({
    where: {
      id,
    },
  });
};

export const updateBook = async (
  id,
  {
    title,
    author,
    isbn,
    publishedAt,
  },
) => {
  return await prisma.book.update({
    where: {
      id,
    },
    data: {
      title,
      author,
      isbn,
      publishedAt,
    },
  });
};

export const patchBook = async (id, data) => {
  return await prisma.book.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteBook = async (id) => {
  return await prisma.book.delete({
    where: {
      id,
    },
  });
};

export const queryBooks = async ({
  id,
  title,
  author,
  isbn,
  publishedAt,
}) => {
  const where = {};

  if (id !== undefined) {
    where.id = id;
  }

  if (title !== undefined) {
    where.title = title;
  }

  if (author !== undefined) {
    where.author = author;
  }

  if (isbn !== undefined) {
    where.isbn = isbn;
  }

  if (publishedAt !== undefined) {
    where.publishedAt = publishedAt;
  }

  return await prisma.book.findMany({
    where,
  });
};

export const bookHasLoans = async (bookId) => {
  const loan = await prisma.loan.findFirst({
    where: {
      bookId,
    },
  });

  return loan !== null;
};