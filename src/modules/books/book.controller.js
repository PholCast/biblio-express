import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  patchBook,
  deleteBook,
  queryBooks,
  bookHasLoans
} from './book.service.js';

export const createBookController = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      publishedAt,
    } = req.body;

    const book = await createBook({
      title,
      author,
      isbn,
      publishedAt,
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
    const { id } = req.params;

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
    const { id } = req.params;

    const {
      title,
      author,
      isbn,
      publishedAt,
    } = req.body;

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
      publishedAt,
    });

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating book',
    });
  }
};

export const patchBookController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBook = await getBookById(id);

    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const book = await patchBook(id, req.body);

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating book',
    });
  }
};

export const deleteBookController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBook = await getBookById(id);

    if (!existingBook) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    if (await bookHasLoans(id)) {
      return res.status(409).json({
        message: 'Book cannot be deleted because it has associated loans',
      });
    }

    await deleteBook(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error deleting book',
    });
  }
};

export const queryBooksController = async (req, res) => {
  try {
    const {
      id,
      title,
      author,
      isbn,
      publishedAt,
    } = req.body;

    const books = await queryBooks({
      id,
      title,
      author,
      isbn,
      publishedAt,
    });

    return res.status(200).json(books);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error querying books',
    });
  }
};