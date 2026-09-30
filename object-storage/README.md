# Biblio Object Storage

Microservicio responsable de guardar los artefactos JSON del flujo de Biblio Express en Azure Blob Storage. Tiene su propio contenedor, imagen, pipeline y versionado.

## Responsables y nubes

La distribución de los componentes transversales del proyecto es la siguiente:

| Integrante | Componente | Proveedor de nube |
|---|---|---|
| Phol Castañeda | Object Storage y artefacto consumidor integrado en Biblio Express | Microsoft Azure |
| Neithan Gómez | Microservicio orquestador y cola | Amazon Web Services (AWS) |
| Daniela Higuita | Componente de caché | Google Cloud Platform (GCP) |

Yo Phol Castañeda opero este microservicio en Azure. La API Biblio Express, también es operada por mi, lo consume mediante el servicio interno `http://object-storage:3001`. Neithan Gómez opera el microservicio orquestador y la cola en AWS, mientras Daniela Higuita opera el componente de caché en GCP. Los componentes se despliegan en proveedores diferentes según la responsabilidad asignada.

## Ejecución local

```bash
pnpm install
copy .env.example .env
pnpm dev
```

El servicio escucha en `http://localhost:3001`.

## Contrato

### `GET /health`

Devuelve `200` cuando el proceso está disponible.

### `POST /artifacts`

Recibe el artefacto producido por la API:

```json
{
  "entity": "users",
  "id": 1,
  "traceId": "correlation-id",
  "otelTraceId": "otel-trace-id",
  "spanId": "span-id",
  "traceparent": "00-...",
  "request": {
    "method": "GET",
    "path": "/api/v2/users/1",
    "x-trace-id": "correlation-id"
  },
  "response": {
    "statusCode": 200,
    "body": {}
  }
}
```

El servicio conserva todos esos campos y agrega `timestamp`. El objeto se guarda como `entity/id-traceId.json` en el contenedor configurado.

La API envía estos artefactos cuando se consulta un recurso por ID mediante `GET /api/v2/users/:id`, `GET /api/v2/books/:id` o `GET /api/v2/loans/:id`. Esas respuestas incluyen la entidad local, un Pokémon y un doctor obtenidos de servicios externos, además de los datos de trazabilidad. Los endpoints V2 `GET /api/v2/:entity/last` actualmente solo devuelven el registro más reciente y no generan artefacto.

El Object Storage no participa en la respuesta de negocio: la API espera la confirmación del guardado, pero si el servicio no está disponible registra el error y conserva la respuesta HTTP original.

### Artefacto almacenado

El contenido persistido tiene esta forma:

```json
{
  "x-trace-id": "correlation-id",
  "otelTraceId": "otel-trace-id",
  "spanId": "span-id",
  "traceparent": "00-...",
  "timestamp": "2026-09-29T12:00:00.000Z",
  "request": {
    "method": "GET",
    "path": "/api/v2/users/1",
    "x-trace-id": "correlation-id"
  },
  "response": {
    "statusCode": 200,
    "body": {}
  }
}
```

El endpoint devuelve `201` con el nombre del blob cuando el guardado es exitoso. Devuelve `400` si faltan campos requeridos del artefacto y `500` si Azure Blob Storage reporta un error.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP, por defecto `3001` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Cuenta de Azure Blob Storage |
| `AZURE_STORAGE_CONTAINER_NAME` | Contenedor destino |

En Kubernetes, el pod usa `object-storage-sa` y Azure Workload Identity. Las credenciales no se incluyen en la imagen.

## Despliegue

```bash
docker build -t biblio-object-storage:v1 .
kubectl apply -f ../k8s/object-storage-configmap.yaml
kubectl apply -f ../k8s/object-storage-service-account.yaml
kubectl apply -f ../k8s/object-storage-deployment.yaml
kubectl apply -f ../k8s/object-storage-service.yaml
```

### Manifiestos Kubernetes

Los manifiestos específicos de este microservicio están en `k8s/`:

- `object-storage-configmap.yaml`: configura el puerto, la cuenta de Azure y el contenedor Blob.
- `object-storage-service-account.yaml`: crea `object-storage-sa` y asocia la identidad administrada de Azure Workload Identity.
- `object-storage-deployment.yaml`: despliega el contenedor, sus recursos y las probes de salud en el puerto `3001`.
- `object-storage-service.yaml`: expone el microservicio dentro del namespace `biblio` mediante el DNS `object-storage:3001`.

Estos archivos son independientes de los manifiestos de la API. El namespace `biblio` y los recursos compartidos del clúster se administran desde el despliegue de la API.

En el despliegue automatizado, [`.github/workflows/object-storage.yml`](../.github/workflows/object-storage.yml) publica `biblio-object-storage` en ACR, confirma su digest y actualiza el Deployment en AKS. Se activa con cambios en `object-storage/` o en sus manifiestos Kubernetes. Después comprueba que el Deployment usa exactamente la imagen publicada.

El pipeline usa `sha-<commit>` para los cambios en `main`. Las releases se versionan con SemVer usando tags `object-storage-vMAJOR.MINOR.PATCH`, por ejemplo `object-storage-v1.1.0`. Solo requiere el secreto `AZURE_CREDENTIALS`; los valores de ACR y AKS están definidos en el workflow.


La API se comunica mediante el DNS interno `http://object-storage:3001`. Su variable `OBJECT_STORAGE_URL` se encuentra en `k8s/configmap.yaml`.

El pipeline [`.github/workflows/object-storage.yml`](../.github/workflows/object-storage.yml) construye, publica y despliega la imagen. Requiere configurar `AZURE_CREDENTIALS` como secreto del repositorio.