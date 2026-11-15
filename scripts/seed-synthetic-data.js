// Crea por HTTP los datos sintéticos que usan el perfil de carga y el
// experimento de caos. Es idempotente: si los datos ya existen, no hace nada.
//
// Uso: node scripts/seed-synthetic-data.js <baseUrl> [cantidad]

const baseUrl = (process.argv[2] ?? '').replace(/\/$/, '');
const amount = Number(process.argv[3] ?? 5);

if (!baseUrl || !Number.isInteger(amount) || amount <= 0) {
  console.error(
    'Usage: node scripts/seed-synthetic-data.js <baseUrl> [amount]',
  );
  process.exit(2);
}

const api = `${baseUrl}/api/v5`;

const request = async (method, path, body) => {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${method} ${path} -> ${response.status} ${JSON.stringify(payload)}`,
    );
  }

  return payload;
};

const list = async (path) => (await request('GET', path)).data ?? [];

const ensure = async (path, existing, isSame, build) => {
  const created = [];

  for (let index = 1; index <= amount; index += 1) {
    const candidate = build(index);
    const found = existing.find((item) => isSame(item, candidate));

    created.push(found ?? (await request('POST', path, candidate)));
  }

  return created;
};
