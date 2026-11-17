# Generador de carga común (k6)

Un único generador para los tres experimentos del grupo. Vive en este repositorio y cada integrante lo ejecuta contra su propio flujo **sin modificar el perfil**.

## Perfil `perfil-comun-v1`

Definido en [`profile.json`](profile.json). Es idéntico en Ronda 0 y Ronda 1.

| Tramo | Duración | Usuarios virtuales |
|---|---|---|
| Subida | 30 s | 0 → 10 |
| Meseta 1 | 60 s | 10 |
| Subida | 30 s | 10 → 20 |
| Meseta 2 | 180 s | 20 |
| Bajada | 30 s | 20 → 0 |

- **Duración total:** 5 min 30 s. **Concurrencia máxima:** 20 usuarios virtuales.
- **Pausa entre peticiones:** 0,5 s por usuario. **Timeout de petición:** 10 s.
- **Ventana de inyección:** del segundo 150 al 270 (120 s), con la carga ya estable en 20 usuarios.

Cada petición se etiqueta con la fase en la que ocurre, según el reloj de la prueba:

| Fase | Intervalo | Uso |
|---|---|---|
| `baseline` | 0–150 s | Estado estable medido |
| `fault` | 150–270 s | Ventana de observación de la métrica objetivo |
| `recovery` | 270–330 s | Vuelta al estado estable |

El fallo debe activarse en el segundo 150. El experimento declarativo lo hace solo; quien inyecte a mano debe respetar ese instante.

## Instalación

En Windows hay dos formas, ambas oficiales:

- **Instalador:** descargar y ejecutar <https://dl.k6.io/msi/k6-latest-amd64.msi>.
- **Binario portátil:** descargar el `.zip` de Windows desde <https://github.com/grafana/k6/releases>, descomprimirlo y agregar su carpeta al `PATH`.

Comprobar con `k6 version`. En Linux o macOS: <https://grafana.com/docs/k6/latest/set-up/install-k6/>. También sirve la imagen `grafana/k6` de Docker.

## Ejecución

Desde la raíz del repositorio:

```bash
k6 run -e BASE_URL=https://mi-api.example.com -e FLOW_PATH=/api/v5/books/1 -e ROUND=ronda-0 load/k6/flow.js
```

| Variable | Valor por defecto | Significado |
|---|---|---|
| `BASE_URL` | `http://localhost:3000` | API que recibe la carga (la coordinadora o la propia) |
| `FLOW_PATH` | `/api/v5/books/1` | Ruta del flujo. Admite varias separadas por coma; se alternan |
| `ROUND` | `calibracion` | Etiqueta de la ronda: `calibracion`, `ronda-0`, `ronda-1` |
| `EXPERIMENT` | `sin-experimento` | Nombre del experimento, para etiquetar las métricas |
| `SUMMARY_PATH` | `load/results/summary.json` | Archivo del resumen por fase |
| `OBJECTIVE_METRIC` | vacío | Métrica objetivo, por ejemplo `http_req_failed{phase:fault}` |
| `OBJECTIVE_EXPR` | vacío | Umbral, por ejemplo `rate<=0.05`. Si no se cumple, k6 termina con error |
| `EXTRA_HEADERS` | vacío | Objeto JSON con cabeceras que van en **todas** las peticiones, por ejemplo para activar protecciones en Ronda 1 |
| `FAULT_HEADERS` | vacío | Objeto JSON con cabeceras que van **solo en la ventana de fallo** (segundos 150 a 270), para interruptores que se activan por cabecera |

Solo cambian el destino, las etiquetas y las cabeceras. La concurrencia, la duración y los escalones salen siempre de `profile.json`. La cabecera `x-trace-id` siempre la genera k6 y no se puede sobrescribir.

## Fallos que se activan por cabecera

Si el interruptor de un integrante se activa con una cabecera, k6 la envía solo dentro de la ventana de fallo. Así el fallo empieza en el segundo 150 y termina en el 270 sin inyectarlo a mano, y las tres fases quedan comparables con las de los demás experimentos.

Ejemplo con la latencia de la API coordinadora (Neithan): 2000 ms en su llamada saliente durante la ventana de fallo.

Ronda 0, sin sus protecciones:

```bash
k6 run -e BASE_URL=<url-de-la-coordinadora> -e FLOW_PATH=/api/v5/flujo -e ROUND=ronda-0 -e FAULT_HEADERS='{"x-peer-latency-ms":"2000"}' load/k6/flow.js
```

Ronda 1, mismo fallo y con sus protecciones en todas las peticiones:

```bash
k6 run -e BASE_URL=<url-de-la-coordinadora> -e FLOW_PATH=/api/v5/flujo -e ROUND=ronda-1 -e FAULT_HEADERS='{"x-peer-latency-ms":"2000"}' -e EXTRA_HEADERS='{"x-peer-resilience":"true"}' load/k6/flow.js
```

La métrica objetivo de un fallo así se lee en la fase `fault` del resumen (por ejemplo `phases.fault.latencyMs.p95`), que dura 120 s. Si el JSON no es válido, k6 se detiene antes de empezar y dice qué variable falló.

## Uso en los tres experimentos

Los workflows de Neithan y Daniela descargan este script desde el commit `7b2aef79`, así que las seis rondas del grupo usan el mismo perfil y el mismo instrumento.

| Integrante | `BASE_URL` y `FLOW_PATH` | `FAULT_HEADERS` (ventana de fallo) | `EXTRA_HEADERS` (Ronda 1) | Métrica y umbral |
|---|---|---|---|---|
| Neithan | ALB de Pokenetes, `/api/v5/flujo` | `{"x-peer-latency-ms":"2000"}` | `{"x-peer-resilience":"true"}` | `http_req_duration{phase:fault}`: `p(95)<=800` |
| Daniela | `http://34.121.168.216`, `/api/v5/hospitals/<id>` | `{"x-fault-mode":"dependency-down"}` | `{"x-peer-resilience":"true"}` | `http_req_failed{phase:fault}`: `rate<=0.01` |
| Phol | Cloud Run de biblio-express, `/api/v5/books/1` | Ninguna: Chaos Toolkit inyecta el fallo en el segundo 150 | Ninguna: las protecciones se activan con `resilience_enabled` | `http_req_failed{phase:fault}` ÷ 5 % ≤ 100 %, evaluado por `chaos/evaluate_objective.py` |

## Resultado

Al terminar, k6 escribe un JSON con las métricas de cada fase:

```json
{
  "round": "ronda-0",
  "profile": "perfil-comun-v1",
  "phases": {
    "fault": {
      "requests": 240,
      "errorRate": 1,
      "successRate": 0,
      "latencyMs": { "p95": 10000 }
    }
  }
}
```

Los números del ejemplo son ilustrativos. Cada petición envía una cabecera `x-trace-id` con el formato `k6-<ronda>-<usuario>-<iteración>`, para localizar su traza y sus logs.

## Métricas de k6 en Grafana Cloud

Para que el tablero muestre la métrica objetivo junto a la ventana de inyección, k6 envía sus métricas a Grafana Cloud (Prometheus) mientras corre:

| Variable | Valor |
|---|---|
| `K6_OUT` | `experimental-prometheus-rw` |
| `K6_PROMETHEUS_RW_SERVER_URL` | URL de *remote write* de Prometheus del stack, terminada en `/api/prom/push` |
| `K6_PROMETHEUS_RW_USERNAME` | ID de usuario (instancia) de Prometheus del stack |
| `K6_PROMETHEUS_RW_PASSWORD` | Token de Grafana Cloud con permiso `metrics:write` |
| `K6_PROMETHEUS_RW_TREND_STATS` | `p(95),p(99),avg,max` |
| `TEST_ID` | Identificador de la ejecución; se agrega como etiqueta `testid` |

Los tres valores de Grafana Cloud están en el portal: **My Account → stack → Prometheus → Details** (URL y usuario) y **Access Policies** (token).

Métricas resultantes, con las etiquetas `phase`, `round`, `experiment`, `profile` y `testid`:

| Métrica en Prometheus | Uso |
|---|---|
| `k6_http_req_failed_rate` | Tasa de error por fase; de ella sale el presupuesto de error consumido de Phol |
| `k6_http_req_duration_p95` | p95 por fase |
| `k6_http_reqs_total` | Peticiones enviadas |
| `k6_vus` | Usuarios virtuales activos |

Ejemplo de consulta para el tablero: `k6_http_req_failed_rate{experiment="pool-exhaustion", phase="fault"}`.

El workflow `chaos-experiment.yml` activa esta salida solo si existe el secreto `K6_PROMETHEUS_RW_SERVER_URL`; sin él, las métricas quedan únicamente en el resumen JSON.

## Datos sintéticos

```bash
node scripts/seed-synthetic-data.js https://mi-api.example.com
```

Crea 5 usuarios, 5 libros y 3 préstamos de prueba. Si ya existen, no los duplica.

## Desde GitHub Actions

El workflow [`chaos-experiment.yml`](../.github/workflows/chaos-experiment.yml) instala k6 y ejecuta este mismo perfil desde un runner de GitHub, sin instalar nada en el equipo. Ver [`chaos/README.md`](../chaos/README.md).
