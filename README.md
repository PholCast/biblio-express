# Biblio Express API

API RESTful para la gestión de una biblioteca, desarrollada con **Node.js**, **Express**, **Prisma ORM**, **PostgreSQL** y **Zod**.

La API administra tres entidades: **Users**, **Books** y **Loans**, e implementa el método HTTP **QUERY** para consultas mediante criterios enviados en el cuerpo de la petición.

## Responsables y nubes

La distribución de los componentes transversales se mantiene separada por integrante y proveedor:

| Integrante | Componente | Proveedor de nube |
|---|---|---|
| Phol Castañeda | API Biblio Express y Object Storage con su artefacto consumidor | Microsoft Azure |
| Neithan Gómez | Microservicio orquestador y cola | Amazon Web Services (AWS) |
| Daniela Higuita | Componente de caché | Google Cloud Platform (GCP) |

Yo Phol Castañeda opero la API biblio-express y el Object Storage en Azure. Neithan Gómez opera el microservicio orquestador y la cola en AWS, mientras Daniela Higuita opera el componente de caché en GCP. Cada componente transversal se despliega en un proveedor distinto según la responsabilidad asignada.

## Diagrama de arquitectura multicloud
![alt text](arquitectura_multicloud.png)



## Tecnologías

- Node.js 24
- Express 5
- Prisma 7
- PostgreSQL / Supabase
- Zod 4
- Vitest
- Docker
- GitHub Actions
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
| `OBJECT_STORAGE_URL` | URL del microservicio Object Storage; por defecto `http://object-storage:3001` |
| `OBJECT_STORAGE_TIMEOUT_MS` | Tiempo máximo de espera para guardar un artefacto, en milisegundos; por defecto `5000` |

El archivo `.env` no debe subirse al repositorio. `.env.example` sirve como referencia.

## Despliegue en Azure

La API se publica como `biblio-express` en Azure Container Registry (ACR) y se despliega en Azure Kubernetes Service (AKS) mediante [`.github/workflows/api.yml`](.github/workflows/api.yml). El workflow construye la imagen, confirma su digest en ACR, aplica los manifiestos del clúster y espera el rollout de `biblio-api-v2`. Después comprueba que el Deployment usa exactamente ese digest.

Configura el secreto `AZURE_CREDENTIALS` en GitHub Actions. Los valores de ACR y AKS están definidos en el workflow: `biblioacrphol`, `biblioacrphol.azurecr.io`, `rg-biblio-azure` y `aks-biblio-azure`. `AZURE_CREDENTIALS` debe corresponder a una identidad con permisos para publicar en ACR y administrar el clúster AKS.

Cada componente se versiona con SemVer. Un push a `main` usa una imagen inmutable con tag `sha-<commit>`; una release de API se crea con un tag `api-vMAJOR.MINOR.PATCH`, por ejemplo `api-v1.1.0`. Para volver a una versión anterior se puede ejecutar `kubectl set image` con el tag semántico correspondiente.


El workflow no aplica `k8s/secret.yaml`: las credenciales deben existir previamente en AKS y administrarse mediante Azure Key Vault/Secrets Store CSI. No se deben almacenar secretos en el repositorio.

## Object Storage separado

El almacenamiento de artefactos es un microservicio independiente en [`object-storage/README.md`](object-storage/README.md). La API no contiene credenciales ni el SDK de Azure: `sendResponseWithArtifact` conserva la firma usada por los controladores V2 y envía el artefacto completo mediante `POST /artifacts`.

La comunicación dentro del clúster usa `http://object-storage:3001`. El cuerpo conserva las entidades (`book`, `loan` o `user`, además de `pokemon` y `doctor`) y los campos `traceId`, `otelTraceId`, `spanId` y `traceparent`. Si el almacenamiento no está disponible, la API registra el error y mantiene la respuesta de negocio, igual que antes.

El microservicio tiene su propio `Dockerfile`, `package.json`, lockfile, README y pipeline `.github/workflows/object-storage.yml`. Su despliegue y sus manifiestos se documentan en [`object-storage/README.md`](object-storage/README.md).

## Kubernetes de la API

Los manifiestos de la API están en `k8s/` y se aplican al namespace `biblio`:

- `namespace.yaml`: crea el namespace del sistema.
- `configmap.yaml`: configuración no sensible de la API, incluido `OBJECT_STORAGE_URL`.
- `service-account.yaml`: identidad administrada de la API para Azure Workload Identity.
- `secret-provider-class.yaml`: integración con Azure Key Vault mediante Secrets Store CSI.
- `secret.yaml`: referencia local de secretos; no se aplica desde el workflow ni debe contener credenciales en el repositorio.
- `deployment.yaml`: despliega `biblio-api-v2`, sus variables, probes, recursos y volumen CSI.
- `service.yaml`: expone la API dentro del clúster mediante un servicio `ClusterIP`.
- `hpa.yaml`: configura el escalado horizontal del Deployment.
- `ingress.yaml`: publica el tráfico HTTP externo hacia el servicio de la API.

El workflow de la API aplica estos manifiestos en AKS y fija la imagen por digest después de publicarla en Azure Container Registry.


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

## API V2

La versión V2 está disponible bajo el prefijo `/api/v2` y conserva todos los endpoints de la V1 para usuarios, libros y préstamos, usando la misma operación con el prefijo V2. Además, agrega los endpoints `last` y `:id` con respuestas enriquecidas, metadatos de versión y trazabilidad.

Por tanto, cada entidad conserva en V2 los endpoints de la V1:

| Método | Endpoint V2 | Descripción |
|---|---|---|
| `POST` | `/api/v2/users`, `/api/v2/books`, `/api/v2/loans` | Crear un recurso |
| `GET` | `/api/v2/users`, `/api/v2/books`, `/api/v2/loans` | Obtener la colección |
| `PUT` | `/api/v2/users/:id`, `/api/v2/books/:id`, `/api/v2/loans/:id` | Actualizar un recurso completo |
| `PATCH` | `/api/v2/users/:id`, `/api/v2/books/:id`, `/api/v2/loans/:id` | Actualizar parcialmente un recurso |
| `DELETE` | `/api/v2/users/:id`, `/api/v2/books/:id`, `/api/v2/loans/:id` | Eliminar un recurso |
| `QUERY` | `/api/v2/users`, `/api/v2/books`, `/api/v2/loans` | Consultar por criterios |

Además, para cada entidad V2 agrega:

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v2/users/last` | Obtiene el usuario creado más recientemente |
| `GET` | `/api/v2/users/:id` | Obtiene un usuario por ID junto con un Pokémon y un doctor externos |
| `GET` | `/api/v2/books/last` | Obtiene el libro creado más recientemente |
| `GET` | `/api/v2/books/:id` | Obtiene un libro por ID junto con un Pokémon y un doctor externos |
| `GET` | `/api/v2/loans/last` | Obtiene el préstamo creado más recientemente |
| `GET` | `/api/v2/loans/:id` | Obtiene un préstamo por ID junto con un Pokémon y un doctor externos |

Los endpoints `GET /api/v2/:entity/:id` construyen una respuesta con la entidad solicitada, los datos de Pokémon y doctor, y metadatos de trazabilidad. Antes de responder, la API envía el artefacto completo a `POST /artifacts` del microservicio Object Storage. El nombre del blob sigue el formato `entity/id-traceId.json`. Si Object Storage no está disponible, la API registra el error y conserva la respuesta de negocio.

Los endpoints `GET /api/v2/:entity/last` devuelven el registro más reciente con los metadatos V2. En la implementación actual no envían un artefacto al Object Storage.

Ejemplos:

```text
GET /api/v2/users/last
GET /api/v2/users/1
GET /api/v2/books/last
GET /api/v2/books/1
GET /api/v2/loans/last
GET /api/v2/loans/1
```

Las respuestas V2 incluyen, cuando están disponibles, `api`, `version`, `x-trace_id`, `trace-id` y `span-id`. Los endpoints `last` devuelven el registro más reciente y los endpoints por ID agregan un Pokémon y un doctor obtenidos de servicios externos. Estos últimos pueden responder `404` si la entidad no existe o `500` si falla la consulta de datos externos.


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
│       ├── api.yml
│       └── object-storage.yml
├── k8s/
│   ├── configmap.yaml
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   ├── namespace.yaml
│   ├── object-storage-configmap.yaml
│   ├── object-storage-deployment.yaml
│   ├── object-storage-service-account.yaml
│   ├── object-storage-service.yaml
│   ├── secret-provider-class.example.yaml
│   ├── secret-provider-class.yaml
│   ├── secret.yaml
│   ├── service-account.yaml
│   └── service.yaml
├── object-storage/
│   ├── src/
│   ├── Dockerfile
│   ├── README.md
│   ├── package.json
│   └── server.js
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
│   │   ├── api.routes.js
│   │   └── api.v2.routes.js
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

GitHub Actions automatiza la construcción, publicación y despliegue de cada componente en Azure.

## API

Workflow: `.github/workflows/api.yml`.

Se ejecuta con cambios en la API, Prisma, Docker o sus manifiestos Kubernetes, además de permitir ejecución manual. Publica `biblio-express` en Azure Container Registry, aplica los manifiestos de `k8s/` y espera el rollout de `biblio-api-v2` en AKS.

## Object Storage

Workflow: `.github/workflows/object-storage.yml`.

Se ejecuta con cambios en `object-storage/` o en sus manifiestos Kubernetes, además de permitir ejecución manual. Publica `biblio-object-storage` en Azure Container Registry y actualiza su Deployment en AKS.

Ambos workflows usan `sha-<commit>` para cambios en `main` y tags SemVer específicos por componente (`api-vMAJOR.MINOR.PATCH` u `object-storage-vMAJOR.MINOR.PATCH`). Requieren el secreto `AZURE_CREDENTIALS`.

Las credenciales deben configurarse en GitHub y no escribirse en los workflows ni en los manifiestos.
