import "dotenv/config";
import { fetchJson } from '../instrumented-fetch.js';

const DOCTORS_API_URL = process.env.DOCTORS_API_URL;

export const getDoctor = async (traceId) => {
  return fetchJson(
    'doctors',
    `${DOCTORS_API_URL}/api/v5/doctors/last`,
    traceId,
  );
};
