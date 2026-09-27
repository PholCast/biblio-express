import { getPokemon } from './pokemon/pokemon.client.js';
import { getDoctor } from './doctors/doctors.client.js';

export const getExternalEntities = async (traceId) => {
  const [pokemonResult, doctorResult] = await Promise.allSettled([
    getPokemon(traceId),
    getDoctor(traceId),
  ]);

  if (pokemonResult.status === 'rejected') {
    console.error('Pokemon API error:', pokemonResult.reason);
  }

  if (doctorResult.status === 'rejected') {
    console.error('Doctor API error:', doctorResult.reason);
  }

  return {
    pokemon:
      pokemonResult.status === 'fulfilled'
        ? pokemonResult.value
        : null,

    doctor:
      doctorResult.status === 'fulfilled'
        ? doctorResult.value
        : null,
  };
};