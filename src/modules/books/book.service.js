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