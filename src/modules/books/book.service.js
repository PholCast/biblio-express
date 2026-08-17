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