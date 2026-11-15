import { getLoanById } from './loan.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';

export const getLoanByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const loan = await getLoanById(id);

    if (!loan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    const { pokemon, doctor } = await getExternalEntities(req.traceId);

    return res.status(200).json({
      loan,
      pokemon,
      doctor,
    });
  } catch (error) {
    console.error('Error getting loan v5:', error);

    return res.status(500).json({
      message: 'Error getting loan',
    });
  }
};
