import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/modules/books/book.service.js', () => ({
  createBook: vi.fn(),
  getBooks: vi.fn(),
  getBookById: vi.fn(),
  updateBook: vi.fn(),
  patchBook: vi.fn(),
  deleteBook: vi.fn(),
  queryBooks: vi.fn(),
  bookHasLoans: vi.fn(),
}));

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

import {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController,
  deleteBookController,
  queryBooksController,
} from '../../src/modules/books/book.controller.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const createResponseMock = () => {
  const res = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);

  return res;
};

describe('createBookController', () => {
  it('should create and return a book', async () => {
    const req = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
    };

    const res = createResponseMock();

    const book = {
      id: 1,
      ...req.body,
    };

    createBook.mockResolvedValue(book);

    await createBookController(req, res);

    expect(createBook).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(book);
  });

  it('should return 500 when creating the book fails', async () => {
    const req = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
    };

    const res = createResponseMock();

    createBook.mockRejectedValue(new Error('Database error'));

    await createBookController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creating book',
    });
  });
});

describe('getBooksController', () => {
  it('should return all books', async () => {
    const req = {};
    const res = createResponseMock();

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

    getBooks.mockResolvedValue(books);

    await getBooksController(req, res);

    expect(getBooks).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(books);
  });

  it('should return 500 when getting books fails', async () => {
    const req = {};
    const res = createResponseMock();

    getBooks.mockRejectedValue(new Error('Database error'));

    await getBooksController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting books',
    });
  });
});

describe('getBookByIdController', () => {
  it('should return the book when it exists', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    const book = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    getBookById.mockResolvedValue(book);

    await getBookByIdController(req, res);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(book);
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue(null);

    await getBookByIdController(req, res);

    expect(getBookById).toHaveBeenCalledWith(999);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 500 when getting the book fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getBookById.mockRejectedValue(new Error('Database error'));

    await getBookByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting book',
    });
  });
});

describe('updateBookController', () => {
  it('should update and return the book', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        title: 'Clean Code 2',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
    };

    const res = createResponseMock();

    const existingBook = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publishedAt: new Date('2008-08-01'),
    };

    const updatedBook = {
      id: 1,
      ...req.body,
    };

    getBookById.mockResolvedValue(existingBook);
    updateBook.mockResolvedValue(updatedBook);

    await updateBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(updateBook).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedBook);
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue(null);

    await updateBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(999);
    expect(updateBook).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 500 when updating the book fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: new Date('2008-08-01'),
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue({
      id: 1,
    });

    updateBook.mockRejectedValue(new Error('Database error'));

    await updateBookController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating book',
    });
  });
});

describe('patchBookController', () => {
  it('should patch and return the book', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        title: 'Clean Code Updated',
      },
    };

    const res = createResponseMock();

    const existingBook = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
    };

    const updatedBook = {
      ...existingBook,
      title: 'Clean Code Updated',
    };

    getBookById.mockResolvedValue(existingBook);
    patchBook.mockResolvedValue(updatedBook);

    await patchBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(patchBook).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedBook);
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
      body: {
        title: 'Clean Code Updated',
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue(null);

    await patchBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(999);
    expect(patchBook).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 500 when patching the book fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        title: 'Clean Code Updated',
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue({
      id: 1,
    });

    patchBook.mockRejectedValue(new Error('Database error'));

    await patchBookController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating book',
    });
  });
});

describe('deleteBookController', () => {
  it('should delete the book and return 204', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue({
      id: 1,
    });

    bookHasLoans.mockResolvedValue(false);
    deleteBook.mockResolvedValue({
      id: 1,
    });

    await deleteBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(bookHasLoans).toHaveBeenCalledWith(1);
    expect(deleteBook).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledOnce();
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue(null);

    await deleteBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(999);
    expect(bookHasLoans).not.toHaveBeenCalled();
    expect(deleteBook).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 409 when the book has associated loans', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue({
      id: 1,
    });

    bookHasLoans.mockResolvedValue(true);

    await deleteBookController(req, res);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(bookHasLoans).toHaveBeenCalledWith(1);
    expect(deleteBook).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book cannot be deleted because it has associated loans',
    });
  });

  it('should return 500 when deleting the book fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getBookById.mockResolvedValue({
      id: 1,
    });

    bookHasLoans.mockResolvedValue(false);
    deleteBook.mockRejectedValue(new Error('Database error'));

    await deleteBookController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error deleting book',
    });
  });
});

describe('queryBooksController', () => {
  it('should query books and return the results', async () => {
    const req = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
      },
    };

    const res = createResponseMock();

    const books = [
      {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
      },
    ];

    queryBooks.mockResolvedValue(books);

    await queryBooksController(req, res);

    expect(queryBooks).toHaveBeenCalledWith({
      id: undefined,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: undefined,
      publishedAt: undefined,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(books);
  });

  it('should return 500 when querying books fails', async () => {
    const req = {
      body: {
        title: 'Clean Code',
      },
    };

    const res = createResponseMock();

    queryBooks.mockRejectedValue(new Error('Database error'));

    await queryBooksController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error querying books',
    });
  });
});