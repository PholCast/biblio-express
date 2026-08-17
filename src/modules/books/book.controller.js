import {
  createBook,
  getBooks,
  getBookById,
  updateBook
} from './book.service.js';

export const createBookController = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publishedAt,
    } = req.body;

    if (
      title === undefined ||
      author === undefined ||
      isbn === undefined ||
      publishedAt === undefined
    ) {
      return res.status(400).json({
        message: 'title, author, isbn and publishedAt are required',
      });
    }

    const date = new Date(publishedAt);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: 'publishedAt must be a valid date',
      });
    }

    const book = await createBook({
      title,
      author,
      isbn,
      publishedAt: date,
    });

    return res.status(201).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error creating book',
    });
  }
};

export const getBooksController = async (req, res) => {
  try {
    const books = await getBooks();

    return res.status(200).json(books);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting books',
    });
  }
};

export const getBookByIdController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting book',
    });
  }
};

export const updateBookController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

    const {
      title,
      author,
      isbn,
      publishedAt,
    } = req.body;

    if (
      title === undefined ||
      author === undefined ||
      isbn === undefined ||
      publishedAt === undefined
    ) {
      return res.status(400).json({
        message: 'PUT requires title, author, isbn and publishedAt',
      });
    }

    const date = new Date(publishedAt);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        message: 'publishedAt must be a valid date',
      });
    }

    const existingBook = await getBookById(id);

    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const book = await updateBook(id, {
      title,
      author,
      isbn,
      publishedAt: date,
    });

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating book',
    });
  }
};