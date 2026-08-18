import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    book: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loan: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/config/prisma.js';

import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  patchBook,
  deleteBook,
  queryBooks,
  bookHasLoans,
} from '../../src/modules/books/book.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createBook', () => {
  it('should create and return a book', async () => {
    const bookData = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    const createdBook = {
      id: 1,
      ...bookData,
    };

    prisma.book.create.mockResolvedValue(createdBook);

    const result = await createBook(bookData);

    expect(prisma.book.create).toHaveBeenCalledWith({
      data: bookData,
    });

    expect(result).toEqual(createdBook);
  });

  it('should propagate an error when creating the book fails', async () => {
    const error = new Error('Database error');

    prisma.book.create.mockRejectedValue(error);

    await expect(
      createBook({
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      }),
    ).rejects.toThrow('Database error');
  });
});

describe('getBooks', () => {
  it('should return all books', async () => {
    const books = [
      {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
      {
        id: 2,
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt',
        isbn: '9780135957059',
        publishedAt: new Date('1999-10-20'),
      },
    ];

    prisma.book.findMany.mockResolvedValue(books);

    const result = await getBooks();

    expect(prisma.book.findMany).toHaveBeenCalledWith();

    expect(result).toEqual(books);
  });

  it('should propagate an error when getting books fails', async () => {
    prisma.book.findMany.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(getBooks()).rejects.toThrow(
      'Database error',
    );
  });
});

describe('getBookById', () => {
  it('should return a book by id', async () => {
    const book = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    prisma.book.findUnique.mockResolvedValue(book);

    const result = await getBookById(1);

    expect(prisma.book.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(book);
  });

  it('should return null when the book does not exist', async () => {
    prisma.book.findUnique.mockResolvedValue(null);

    const result = await getBookById(999);

    expect(result).toBeNull();
  });

  it('should propagate an error when getting the book fails', async () => {
    prisma.book.findUnique.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      getBookById(1),
    ).rejects.toThrow('Database error');
  });
});

describe('updateBook', () => {
  it('should update and return a book', async () => {
    const bookData = {
      title: 'Clean Code Updated',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    const updatedBook = {
      id: 1,
      ...bookData,
    };

    prisma.book.update.mockResolvedValue(updatedBook);

    const result = await updateBook(1, bookData);

    expect(prisma.book.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: bookData,
    });

    expect(result).toEqual(updatedBook);
  });

  it('should propagate an error when updating the book fails', async () => {
    prisma.book.update.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      updateBook(1, {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      }),
    ).rejects.toThrow('Database error');
  });
});

describe('patchBook', () => {
  it('should partially update and return a book', async () => {
    const data = {
      title: 'Clean Code Updated',
    };

    const updatedBook = {
      id: 1,
      title: 'Clean Code Updated',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    prisma.book.update.mockResolvedValue(updatedBook);

    const result = await patchBook(1, data);

    expect(prisma.book.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data,
    });

    expect(result).toEqual(updatedBook);
  });

  it('should propagate an error when patching the book fails', async () => {
    prisma.book.update.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      patchBook(1, {
        title: 'Clean Code Updated',
      }),
    ).rejects.toThrow('Database error');
  });
});

describe('deleteBook', () => {
  it('should delete and return a book', async () => {
    const deletedBook = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    prisma.book.delete.mockResolvedValue(deletedBook);

    const result = await deleteBook(1);

    expect(prisma.book.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(deletedBook);
  });

  it('should propagate an error when deleting the book fails', async () => {
    prisma.book.delete.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      deleteBook(1),
    ).rejects.toThrow('Database error');
  });
});

describe('queryBooks', () => {
  it('should query books using all criteria', async () => {
    const publishedAt = new Date('2008-08-01');

    const books = [
      {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt,
      },
    ];

    prisma.book.findMany.mockResolvedValue(books);

    const result = await queryBooks({
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt,
    });

    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt,
      },
    });

    expect(result).toEqual(books);
  });

  it('should query books using only the provided criteria', async () => {
    prisma.book.findMany.mockResolvedValue([]);

    const result = await queryBooks({
      author: 'Robert C. Martin',
    });

    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {
        author: 'Robert C. Martin',
      },
    });

    expect(result).toEqual([]);
  });

  it('should query all books when no criteria are provided', async () => {
    prisma.book.findMany.mockResolvedValue([]);

    const result = await queryBooks({});

    expect(prisma.book.findMany).toHaveBeenCalledWith({
      where: {},
    });

    expect(result).toEqual([]);
  });

  it('should propagate an error when querying books fails', async () => {
    prisma.book.findMany.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      queryBooks({
        title: 'Clean Code',
      }),
    ).rejects.toThrow('Database error');
  });
});

describe('bookHasLoans', () => {
  it('should return true when the book has loans', async () => {
    prisma.loan.findFirst.mockResolvedValue({
      id: 1,
      bookId: 1,
    });

    const result = await bookHasLoans(1);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        bookId: 1,
      },
    });

    expect(result).toBe(true);
  });

  it('should return false when the book has no loans', async () => {
    prisma.loan.findFirst.mockResolvedValue(null);

    const result = await bookHasLoans(1);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        bookId: 1,
      },
    });

    expect(result).toBe(false);
  });

  it('should propagate an error when checking book loans fails', async () => {
    prisma.loan.findFirst.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(
      bookHasLoans(1),
    ).rejects.toThrow('Database error');
  });
});