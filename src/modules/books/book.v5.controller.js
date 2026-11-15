import { getBookById } from './book.service.js';
import { getBookAvailability } from './book.v5.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';
import {
  loadWithStaleFallback,
  sendDbError,
} from '../../resilience/db-fallback.js';

const loadBookDetail = async (id) => {
  const book = await getBookById(id);

  if (!book) {
    return null;
  }

  const availability = await getBookAvailability(id);

  return { book, availability };
};

export const getBookByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { value: detail, degraded } = await loadWithStaleFallback(
      req,
      res,
      `book:${id}`,
      () => loadBookDetail(id),
    );

    if (!detail) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const { pokemon, doctor } = await getExternalEntities(req.traceId);

    return res.status(200).json({
      ...detail,
      pokemon,
      doctor,
      ...(degraded ? { degraded: true } : {}),
    });
  } catch (error) {
    console.error('Error getting book v5:', error);

    return sendDbError(req, res, error, 'Error getting book');
  }
};
