import { getBookById } from './book.service.js';
import { sendResponseWithArtifactV3 } from '../../infrastructure/storage/flow-artifact.service.js';

export const getBookByIdV3Controller = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    return sendResponseWithArtifactV3({
      req,
      res,
      entity: 'books',
      id,
      body: { book },
    });
  } catch (error) {
    console.error('Error getting book v3:', error);

    return res.status(500).json({
      message: 'Error getting book',
    });
  }
};
