import { getUserById } from './user.service.js';
import { getUserLoanSummary } from './user.v5.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';
import {
  loadWithStaleFallback,
  sendDbError,
} from '../../resilience/db-fallback.js';

const loadUserDetail = async (id) => {
  const user = await getUserById(id);

  if (!user) {
    return null;
  }

  const loans = await getUserLoanSummary(id);

  return { user, loans };
};

export const getUserByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { value: detail, degraded } = await loadWithStaleFallback(
      req,
      res,
      `user:${id}`,
      () => loadUserDetail(id),
    );

    if (!detail) {
      return res.status(404).json({
        message: 'User not found',
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
    console.error('Error getting user v5:', error);

    return sendDbError(req, res, error, 'Error getting user');
  }
};
