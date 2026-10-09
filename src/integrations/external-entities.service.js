import 'dotenv/config';
import { getPokemon } from './pokemon/pokemon.client.js';
import { getDoctor } from './doctors/doctors.client.js';

const warnedMissingConfiguration = new Set();

const warnMissingConfiguration = (name) => {
  if (warnedMissingConfiguration.has(name)) {
    return;
  }

  warnedMissingConfiguration.add(name);
  console.warn(
    `External entity integration disabled: ${name} is not configured`
  );
};

export const getExternalEntities = async (traceId) => {
  const pokemonConfigured = Boolean(process.env.POKEMON_API_URL);
  const doctorConfigured = Boolean(process.env.DOCTORS_API_URL);
  const requests = [];

  if (pokemonConfigured) {
    requests.push(['pokemon', getPokemon(traceId)]);
  } else {
    warnMissingConfiguration('POKEMON_API_URL');
  }

  if (doctorConfigured) {
    requests.push(['doctor', getDoctor(traceId)]);
  } else {
    warnMissingConfiguration('DOCTORS_API_URL');
  }

  const results = await Promise.allSettled(
    requests.map(([, request]) => request)
  );
  const entityResults = Object.fromEntries(
    results.map((result, index) => [requests[index][0], result])
  );
  const pokemonResult = entityResults.pokemon;
  const doctorResult = entityResults.doctor;

  if (pokemonResult?.status === 'rejected') {
    console.error('Pokemon API error:', pokemonResult.reason);
  }

  if (doctorResult?.status === 'rejected') {
    console.error('Doctor API error:', doctorResult.reason);
  }

  return {
    pokemon:
      pokemonResult?.status === 'fulfilled'
        ? pokemonResult.value
        : null,

    doctor:
      doctorResult?.status === 'fulfilled'
        ? doctorResult.value
        : null,
  };
};