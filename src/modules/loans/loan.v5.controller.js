import { getLastLoan } from './loan.v2.service.js';
import { getLoanById } from './loan.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';
import {
  loadWithStaleFallback,
  sendDbError,
} from '../../resilience/db-fallback.js';

const loadLoanDetail = async (id) => {
  const loan = await getLoanById(id);

  return loan ? { loan } : null;
};

export const getLoanByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { value: detail, degraded } = await loadWithStaleFallback(
      req,
      res,
      `loan:${id}`,
      () => loadLoanDetail(id),
    );

    if (!detail) {
      return res.status(404).json({
        message: 'Loan not found',
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
    console.error('Error getting loan v5:', error);

    return sendDbError(req, res, error, 'Error getting loan');
  }
};

export const getLastLoanV5Controller = async (req, res) => {
  try {
    const { value: loan, degraded } = await loadWithStaleFallback(
      req,
      res,
      'loan:last',
      getLastLoan,
    );

    if (!loan) {
      return res.status(404).json({
        message: 'No loans found',
      });
    }

    return res.status(200).json({
      loan,
      ...(degraded ? { degraded: true } : {}),
    });
  } catch (error) {
    console.error('Error getting last loan v5:', error);

    return sendDbError(req, res, error, 'Error getting last loan');
  }
};
