import "dotenv/config";
import { fetchJson } from '../instrumented-fetch.js';

const POKEMON_API_URL = process.env.POKEMON_API_URL;

export const getPokemon = async (traceId) => {
  return fetchJson(
    'pokemon',
    `${POKEMON_API_URL}/api/v5/pokemon/last`,
    traceId,
  );
};
