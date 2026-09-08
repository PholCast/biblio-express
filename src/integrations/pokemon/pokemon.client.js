import "dotenv/config";

const POKEMON_API_URL = process.env.POKEMON_API_URL;

export const getPokemon = async () => {
  const response = await fetch(
    `${POKEMON_API_URL}/pokemon`
  );

  if (!response.ok) {
    throw new Error(
      `Pokemon API returned status ${response.status}`
    );
  }

  return response.json();
};