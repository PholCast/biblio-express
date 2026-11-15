import { resilienceConfig } from './resilience.config.js';

// Última respuesta buena por clave. Map conserva el orden de inserción, así
// que la primera clave es siempre la más antigua.
const entries = new Map();

export const rememberFresh = (key, value) => {
  if (!resilienceConfig.staleCacheEnabled) {
    return;
  }

  entries.delete(key);
  entries.set(key, { value, storedAt: Date.now() });

  if (entries.size > resilienceConfig.staleCacheMaxEntries) {
    entries.delete(entries.keys().next().value);
  }
};

export const recallStale = (key) => {
  if (!resilienceConfig.staleCacheEnabled) {
    return null;
  }

  const entry = entries.get(key);

  if (!entry) {
    return null;
  }

  const ageMs = Date.now() - entry.storedAt;

  if (ageMs > resilienceConfig.staleCacheTtlMs) {
    entries.delete(key);
    return null;
  }

  return { value: entry.value, ageMs };
};

export const clearStaleCache = () => entries.clear();
