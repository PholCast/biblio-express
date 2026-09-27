import "dotenv/config";

const POKEMON_API_URL = process.env.POKEMON_API_URL;

export const getPokemon = async (traceId) => {
  const response = await fetch(
    `${POKEMON_API_URL}/api/v2/pokemon/last`,
    {
      headers: {
        'x-trace-id': traceId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Pokemon API returned status ${response.status}`
    );
  }

  return response.json();
};