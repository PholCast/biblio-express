import {
  createBook
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