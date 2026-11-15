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

const users = await ensure(
  '/users',
  await list('/users'),
  (item, candidate) => item.email === candidate.email,
  (index) => ({
    name: `Usuario Sintetico ${index}`,
    email: `chaos.user${index}@example.com`,
  }),
);

const books = await ensure(
  '/books',
  await list('/books'),
  (item, candidate) => item.isbn === candidate.isbn,
  (index) => ({
    title: `Libro Sintetico ${index}`,
    author: 'Ingenieria del Caos',
    isbn: `978000000${String(index).padStart(4, '0')}`,
    publishedAt: '2026-01-01',
  }),
);

const loans = await list('/loans');

// Un préstamo activo por cada libro impar, para tener ambos estados.
for (let index = 0; index < amount; index += 2) {
  const book = books[index];
  const hasActiveLoan = loans.some(
    (loan) => loan.bookId === book.id && loan.returnedAt === null,
  );

  if (!hasActiveLoan) {
    await request('POST', '/loans', {
      userId: users[index].id,
      bookId: book.id,
      borrowedAt: '2026-11-01T00:00:00.000Z',
      dueDate: '2026-12-01T00:00:00.000Z',
      returnedAt: null,
    });
  }
}

console.log(
  JSON.stringify(
    {
      users: users.map((user) => user.id),
      books: books.map((book) => book.id),
    },
    null,
    2,
  ),
);
