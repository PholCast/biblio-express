import { getBookById } from './book.service.js';
import { getLastBook } from './book.v2.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';
import { sendResponseWithArtifact } from '../../infrastructure/storage/flow-artifact.service.js';

export const getBookByIdV2Controller = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const { pokemon, doctor } = await getExternalEntities(req.traceId);

    const responseBody = {
      book,
      pokemon,
      doctor,
    };
  
    return sendResponseWithArtifact({
      req,
      res,
      entity: 'books',
      id,
      body: responseBody,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting book, Pokemon and doctor',
    });
  }
};

export const getLastBookV2Controller = async (req, res) => {
  try {
    const book = await getLastBook();

    if (!book) {
      return res.status(404).json({
        message: 'No books found',
      });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting last book',
    });
  }
};