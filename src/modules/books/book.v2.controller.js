import { getBooks } from './book.service.js';
import { getPokemon } from '../../integrations/pokemon/pokemon.client.js';

export const getBooksV2Controller = async (req, res) => {
  try {
    const [books, pokemon] = await Promise.all([
      getBooks(),
      getPokemon(),
    ]);

    return res.status(200).json({
      books,
      pokemon,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting books and Pokemon',
    });
  }
};