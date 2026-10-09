import { getLoanById } from './loan.service.js';
import { sendResponseWithArtifactV3 } from '../../infrastructure/storage/flow-artifact.service.js';

export const getLoanByIdV3Controller = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await getLoanById(id);

    if (!loan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    return sendResponseWithArtifactV3({
      req,
      res,
      entity: 'loans',
      id,
      body: { loan },
    });
  } catch (error) {
    console.error('Error getting loan v3:', error);

    return res.status(500).json({
      message: 'Error getting loan',
    });
  }
};
