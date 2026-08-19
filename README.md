# Biblio Express API

API RESTful para la gestión de una biblioteca, desarrollada con **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL** y **Zod**.

La API administra tres entidades: **Users**, **Books** y **Loans**, e implementa el método HTTP **QUERY** para consultas mediante criterios enviados en el cuerpo de la petición.

## Tecnologías

- Node.js 24
- Express 5
- Prisma 7
- PostgreSQL / Supabase
- Zod 4
- Vitest
- Docker
- GitHub Actions
- Render
- pnpm 11

## Requisitos

- Node.js 24+
- pnpm 11+
- PostgreSQL/Supabase
- Git

## Instalación

```bash
git clone <REPOSITORY_URL>
cd biblio-express
pnpm install
```

Crear `.env` a partir de `.env.example`:

```env
PORT=3000
DATABASE_URL=postgresql://...
```

Generar Prisma Client:

```bash
pnpm exec prisma generate
```

## Ejecución local

Desarrollo:

```bash
pnpm run dev
```

Producción/local normal:

```bash
pnpm start
```

Con `PORT=3000`, la aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor |
| `DATABASE_URL` | URL de conexión a PostgreSQL |

El archivo `.env` no debe subirse al repositorio. `.env.example` sirve como referencia.


## 🗃️ Modelos de base de datos

La aplicación utiliza PostgreSQL mediante Prisma ORM. La base de datos está compuesta por tres tablas principales: `User`, `Book` y `Loan`.

### User

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincremental | Identificador único del usuario |
| `name` | `String` | Obligatorio | Nombre del usuario |
| `email` | `String` | Obligatorio, único | Correo electrónico del usuario |
| `createdAt` | `DateTime` | Obligatorio, valor por defecto `now()` | Fecha y hora de creación del usuario |

---

### Book

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincremental | Identificador único del libro |
| `title` | `String` | Obligatorio | Título del libro |
| `author` | `String` | Obligatorio | Autor del libro |
| `isbn` | `String` | Obligatorio, único | ISBN del libro |
| `publishedAt` | `DateTime` | Obligatorio | Fecha de publicación del libro |

---

### Loan

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `Int` | PK, autoincremental | Identificador único del préstamo |
| `userId` | `Int` | FK → `User.id` | Identificador del usuario que realiza el préstamo |
| `bookId` | `Int` | FK → `Book.id` | Identificador del libro asociado al préstamo |
| `borrowedAt` | `DateTime` | Obligatorio, valor por defecto `now()` | Fecha y hora en que se realiza el préstamo |
| `dueDate` | `DateTime` | Obligatorio | Fecha límite de devolución |
| `returnedAt` | `DateTime` | Opcional / nullable | Fecha y hora de devolución del libro |

---

### Relaciones

```text
User 1 ───────── N Loan N ───────── 1 Book
```

- Un `User` puede tener múltiples `Loan`.
- Un `Book` puede estar asociado a múltiples `Loan`.
- Cada `Loan` pertenece a un `User`.
- Cada `Loan` pertenece a un `Book`.

El modelo está definido en `prisma/schema.prisma`.

### Restricciones principales

- `User.id` es la clave primaria y se genera automáticamente.
- `User.email` debe ser único.
- `Book.id` es la clave primaria y se genera automáticamente.
- `Book.isbn` debe ser único.
- `Loan.id` es la clave primaria y se genera automáticamente.
- `Loan.userId` referencia a `User.id`.
- `Loan.bookId` referencia a `Book.id`.
- `Loan.returnedAt` puede ser `NULL` mientras el préstamo no haya sido devuelto.


# Comandos disponibles

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala dependencias |
| `pnpm run dev` | Servidor en desarrollo |
| `pnpm start` | Ejecuta el servidor |
| `pnpm test` | Ejecuta Vitest |
| `pnpm test:run` | Ejecuta pruebas una vez |
| `pnpm test:coverage` | Pruebas con cobertura |
| `pnpm exec prisma generate` | Genera Prisma Client |


## Health Check

### `GET /health`

Respuesta:

```json
{
  "status": "ok"
}
```

## API

Todas las rutas principales utilizan el prefijo `/api`.

- `/api/users`
- `/api/books`
- `/api/loans`


# 📌 Endpoints disponibles

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/users` | Crear usuario |
| `GET` | `/api/users` | Obtener usuarios |
| `GET` | `/api/users/:id` | Obtener usuario |
| `PUT` | `/api/users/:id` | Actualizar usuario |
| `PATCH` | `/api/users/:id` | Actualizar parcialmente usuario |
| `DELETE` | `/api/users/:id` | Eliminar usuario |
| `QUERY` | `/api/users` | Consultar usuarios |
| `POST` | `/api/books` | Crear libro |
| `GET` | `/api/books` | Obtener libros |
| `GET` | `/api/books/:id` | Obtener libro |
| `PUT` | `/api/books/:id` | Actualizar libro |
| `PATCH` | `/api/books/:id` | Actualizar parcialmente libro |
| `DELETE` | `/api/books/:id` | Eliminar libro |
| `QUERY` | `/api/books` | Consultar libros |
| `POST` | `/api/loans` | Crear préstamo |
| `GET` | `/api/loans` | Obtener préstamos |
| `GET` | `/api/loans/:id` | Obtener préstamo |
| `PUT` | `/api/loans/:id` | Actualizar préstamo |
| `PATCH` | `/api/loans/:id` | Actualizar parcialmente préstamo |
| `DELETE` | `/api/loans/:id` | Eliminar préstamo |
| `QUERY` | `/api/loans` | Consultar préstamos |


# Users

## `POST /api/users`

Crea un usuario.

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Respuesta: `201 Created`.

El email debe ser válido y único. Si ya existe, devuelve `409 Conflict`:

```json
{
  "message": "User with this email already exists"
}
```

## `GET /api/users`

Obtiene todos los usuarios.

Respuesta: `200 OK`.

## `GET /api/users/:id`

Obtiene un usuario por ID. Si no existe devuelve `404 Not Found`:

```json
{
  "message": "User not found"
}
```

## `PUT /api/users/:id`

Actualiza completamente un usuario. Requiere `name` y `email`.

```json
{
  "name": "Updated User",
  "email": "updated@example.com"
}
```

Respuesta: `200 OK`. Un email perteneciente a otro usuario produce `409 Conflict`.

## `PATCH /api/users/:id`

Actualiza parcialmente un usuario. Debe enviarse al menos un campo.

```json
{
  "name": "New Name"
}
```

Respuesta: `200 OK`.

## `DELETE /api/users/:id`

Elimina un usuario. Respuesta exitosa: `204 No Content`.

Un usuario con préstamos asociados no puede eliminarse y devuelve `409 Conflict`.

## `QUERY /api/users`

Consulta usuarios mediante criterios en el body. Criterios disponibles: `id`, `name`, `email`, `createdAt`.

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Debe existir al menos un criterio. Respuesta: `200 OK`.

# Books

## `POST /api/books`

Crea un libro.

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedAt": "2008-08-01"
}
```

Respuesta: `201 Created`. El ISBN debe ser único.

## `GET /api/books`

Obtiene todos los libros. Respuesta: `200 OK`.

## `GET /api/books/:id`

Obtiene un libro por ID. Si no existe devuelve `404 Not Found`.

## `PUT /api/books/:id`

Actualiza completamente un libro.

```json
{
  "title": "Clean Code 2",
  "author": "Robert C. Martin",
  "isbn": "9780132350884",
  "publishedAt": "2008-08-01"
}
```

Respuesta: `200 OK`.

## `PATCH /api/books/:id`

Actualiza parcialmente un libro.

```json
{
  "title": "Clean Code - Updated"
}
```

Debe enviarse al menos un campo. Respuesta: `200 OK`.

## `DELETE /api/books/:id`

Elimina un libro. Respuesta exitosa: `204 No Content`.

Un libro asociado a préstamos no puede eliminarse.

## `QUERY /api/books`

Criterios disponibles: `id`, `title`, `author`, `isbn`, `publishedAt`.

```json
{
  "author": "Robert C. Martin",
  "title": "Clean Code"
}
```

Debe existir al menos un criterio.

# Loans

Los préstamos relacionan un usuario con un libro y contienen fechas de préstamo, vencimiento y devolución.

## `POST /api/loans`

Crea un préstamo.

```json
{
  "userId": 1,
  "bookId": 1,
  "dueDate": "2026-08-25T00:00:00.000Z"
}
```

`borrowedAt` es opcional y se genera automáticamente. `returnedAt` es opcional y por defecto es `null`.

También puede enviarse el objeto completo:

```json
{
  "userId": 1,
  "bookId": 1,
  "borrowedAt": "2026-08-18T15:00:00.000Z",
  "dueDate": "2026-08-25T15:00:00.000Z",
  "returnedAt": null
}
```

Las fechas deben respetar las reglas de validación de préstamos.

## `GET /api/loans`

Obtiene todos los préstamos. Respuesta: `200 OK`.

## `GET /api/loans/:id`

Obtiene un préstamo por ID. Si no existe devuelve `404 Not Found`.

## `PUT /api/loans/:id`

Actualiza completamente un préstamo.

```json
{
  "userId": 1,
  "bookId": 1,
  "borrowedAt": "2026-08-18T15:00:00.000Z",
  "dueDate": "2026-08-25T15:00:00.000Z",
  "returnedAt": null
}
```

## `PATCH /api/loans/:id`

Actualiza parcialmente un préstamo.

```json
{
  "returnedAt": "2026-08-20T15:00:00.000Z"
}
```

## `DELETE /api/loans/:id`

Elimina un préstamo. Respuesta exitosa: `204 No Content`.

## `QUERY /api/loans`

Criterios disponibles: `id`, `userId`, `bookId`, `borrowedAt`, `dueDate`, `returnedAt`.

```json
{
  "userId": 1,
  "bookId": 1
}
```

Debe existir al menos un criterio.

# Validación

Las peticiones se validan con **Zod** mediante `src/middlewares/validate.js`.

Schemas por módulo:

```text
src/modules/users/user.schema.js
src/modules/books/book.schema.js
src/modules/loans/loan.schema.js
```

Se validan, entre otros:

- Campos obligatorios.
- Strings no vacíos.
- Emails válidos.
- IDs enteros positivos.
- Fechas válidas.
- Criterios QUERY.
- PATCH con al menos un campo.
- Coherencia de fechas de préstamos.

# Códigos HTTP

| Código | Significado |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `204` | Recurso eliminado correctamente |
| `404` | Recurso no encontrado |
| `409` | Conflicto con el estado actual del recurso |
| `500` | Error interno del servidor |

# Arquitectura

La aplicación separa responsabilidades por módulos:

```text
Routes
   ↓
Validation Middleware
   ↓
Controller
   ↓
Service
   ↓
Prisma
   ↓
PostgreSQL
```

- **Routes:** definen endpoints y conectan middleware/controllers.
- **Schemas:** contienen las reglas de validación Zod.
- **Controllers:** gestionan HTTP, códigos de estado y respuestas.
- **Services:** contienen acceso a datos y lógica de negocio.
- **Prisma:** proporciona acceso ORM a PostgreSQL.

# Estructura del proyecto

```text
biblio-express/
├── .github/
│   └── workflows/
│       ├── production.yml
│       └── testing.yml
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── prisma.js
│   ├── middlewares/
│   │   └── validate.js
│   ├── modules/
│   │   ├── books/
│   │   │   ├── book.controller.js
│   │   │   ├── book.routes.js
│   │   │   ├── book.schema.js
│   │   │   └── book.service.js
│   │   ├── loans/
│   │   │   ├── loan.controller.js
│   │   │   ├── loan.routes.js
│   │   │   ├── loan.schema.js
│   │   │   └── loan.service.js
│   │   └── users/
│   │       ├── user.controller.js
│   │       ├── user.routes.js
│   │       ├── user.schema.js
│   │       └── user.service.js
│   ├── routes/
│   │   └── api.routes.js
│   └── app.js
├── tests/
│   ├── books/
│   ├── loans/
│   └── users/
├── .dockerignore
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prisma.config.ts
├── server.js
└── vitest.config.js
```

# Pruebas

El proyecto utiliza Vitest.

```bash
pnpm test
```

Ejecutar una sola vez:

```bash
pnpm test:run
```

Ejecutar con cobertura:

```bash
pnpm test:coverage
```

Las pruebas cubren controllers, services, schemas y routes.

# Docker

Construir la imagen:

```bash
docker build -t biblio-express .
```

Ejecutar el contenedor:

```bash
docker run --env-file .env -p 3000:3000 biblio-express
```

El Dockerfile instala las dependencias y ejecuta `prisma generate` durante la construcción de la imagen.

# CI/CD

GitHub Actions automatiza pruebas, cobertura, construcción de Docker y despliegue.

## Testing

Workflow:

```text
.github/workflows/testing.yml
```

Se ejecuta con `push` sobre la rama `testing` y realiza:

1. Checkout del repositorio.
2. Configuración de Node.js 24 y pnpm.
3. Instalación con `pnpm install --frozen-lockfile`.
4. Pruebas con cobertura.
5. Construcción de la imagen Docker.
6. Deploy mediante Render Deploy Hook de Testing.

## Production

Workflow:

```text
.github/workflows/production.yml
```

Se ejecuta con `push` sobre `main` y realiza los mismos pasos utilizando el ambiente Production.

# Ambientes

| Ambiente | Rama | Deploy |
|---|---|---|
| Testing | `testing` | Render Testing |
| Production | `main` | Render Production |

Los ambientes deben mantenerse independientes mediante diferentes URLs, bases de datos, variables y secrets.

# Coverage

Production ejecuta:

```text
COVERAGE_THRESHOLD=85
```

Testing ejecuta:

```text
COVERAGE_THRESHOLD=60
```

# GitHub Actions Secrets

Production utiliza:

```text
RENDER_DEPLOY_HOOK_PRODUCTION
```

Testing utiliza:

```text
RENDER_DEPLOY_HOOK_TESTING
```

Los secrets deben configurarse en GitHub y no escribirse directamente en los workflows.
