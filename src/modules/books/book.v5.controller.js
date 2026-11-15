import { getBookById } from './book.service.js';
import { getBookAvailability } from './book.v5.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';

export const getBookByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const availability = await getBookAvailability(id);
    const { pokemon, doctor } = await getExternalEntities(req.traceId);

    return res.status(200).json({
      book,
      availability,
      pokemon,
      doctor,
    });
  } catch (error) {
    console.error('Error getting book v5:', error);

    return res.status(500).json({
      message: 'Error getting book',
    });
  }
};
