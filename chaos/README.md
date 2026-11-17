# Experimento de caos: agotamiento del pool de conexiones

Experimento declarativo de Phol para la API `biblio-express` en Google Cloud Run. Usa [Chaos Toolkit](https://chaostoolkit.org/), porque Cloud Run no es Kubernetes y Chaos Mesh no lo cubre.

| Archivo | Contenido |
|---|---|
| [`experiments/pool-exhaustion.yaml`](experiments/pool-exhaustion.yaml) | Estado estable, hipótesis, método, parámetros de inyección, radio de impacto, duración, condiciones de aborto y reversión |
| [`evaluate_objective.py`](evaluate_objective.py) | Compara la métrica objetivo medida por k6 con el umbral declarado |
| [`requirements.txt`](requirements.txt) | Versiones de Chaos Toolkit |
| `results/` | Evidencias de cada ronda (journal, resumen de k6 y resultado) |

## Instalación

```bash
pip install -r chaos/requirements.txt
```

También hace falta k6 (ver [`load/README.md`](../load/README.md)).

## El interruptor de fallo

Está en el código de la API (`src/chaos/`). Solo existe si la API arranca con `CHAOS_ENABLED=true`, y cada orden exige la cabecera `x-chaos-token`.

| Petición | Efecto |
|---|---|
| `POST /chaos/pool-exhaustion` con `{ "hold": 10, "durationSeconds": 120 }` | Retiene `hold` conexiones del pool durante `durationSeconds` |
| `DELETE /chaos/pool-exhaustion` | Libera las conexiones de inmediato |
| `GET /chaos/status` | Estado del fallo y del pool |

El fallo se apaga solo al cumplirse `durationSeconds` (máximo 300 s), aunque nadie envíe el `DELETE`.

## Probar la reversión antes de la primera ejecución

```bash
curl -X POST "$BASE_URL/chaos/pool-exhaustion" -H "x-chaos-token: $CHAOS_TOKEN" -H "content-type: application/json" -d '{"hold":10,"durationSeconds":30}'
```

```bash
curl -X DELETE "$BASE_URL/chaos/pool-exhaustion" -H "x-chaos-token: $CHAOS_TOKEN"
```

```bash
curl "$BASE_URL/chaos/status" -H "x-chaos-token: $CHAOS_TOKEN"
```

La última respuesta debe mostrar `"active": false` y `"heldConnections": 0`. Repite el `POST` sin enviar el `DELETE` y comprueba que a los 30 s el estado vuelve solo a `"active": false`.

## Ejecutar una ronda desde GitHub Actions

Es la forma usada para las mediciones oficiales: el runner instala Chaos Toolkit y k6, y las tres ejecuciones salen del mismo tipo de máquina.

1. **Actions** → **Chaos Experiment** → **Run workflow**, sobre `main`.
2. `round`: `calibracion`, `0` o `1`. `base_url` vacío (usa la variable `GCP_FINAL_SERVICE_URL`). `flow_path`: `/api/v5/books/1`.
3. Al terminar, el resumen de la ejecución muestra el `result.json` y el artefacto `chaos-round-<ronda>-<id>` guarda las evidencias.

Requiere la variable `GCP_FINAL_SERVICE_URL` y el secreto `GCP_FINAL_CHAOS_TOKEN`. El job falla si la métrica objetivo incumple el umbral: en Ronda 0 sale en rojo y en Ronda 1 debe salir en verde.

## Ejecutar una ronda desde un equipo propio

Con `BASE_URL` y `CHAOS_TOKEN` definidos, desde la raíz del repositorio:

```powershell
.\scripts\chaos\run-round.ps1 -Round calibracion -BaseUrl $env:BASE_URL
```

```powershell
.\scripts\chaos\run-round.ps1 -Round 0 -BaseUrl $env:BASE_URL
```

```powershell
.\scripts\chaos\run-round.ps1 -Round 1 -BaseUrl $env:BASE_URL
```

En Linux o en el pipeline: `scripts/chaos/run-round.sh <calibracion|0|1>`.

| Ronda | Configuración de la API | Qué hace |
|---|---|---|
| `calibracion` | Cualquiera | Solo carga, sin fallo. Mide el estado estable |
| `0` | `resilience_enabled = false` | Carga + fallo, sin las protecciones nuevas |
| `1` | `resilience_enabled = true` | Misma carga y mismo fallo, con las protecciones |

Antes de inyectar, el script comprueba que `/health` y la ruta del flujo respondan 200; si no, no ejecuta nada. Cada ronda dura 5 min 30 s: 150 s de línea base, 120 s de fallo y 60 s de recuperación. El script termina con error si la métrica objetivo incumple el umbral, que es el comportamiento que necesita la puerta de calidad del pipeline.

## Evidencias

En `chaos/results/ronda-N/` (o en el artefacto del workflow):

- `journal.json`: registro de Chaos Toolkit (sondas, acciones, rollbacks y veredicto).
- `k6-summary.json`: métricas por fase.
- `result.json`: métrica objetivo, umbral y veredicto de la hipótesis.

La calibración solo ejecuta k6, así que deja únicamente `chaos/results/calibracion/k6-summary.json`. Su fase `baseline` da el estado estable (tasa de éxito y p95) que se registra en `steady_state` del experimento.

## Abortar

`Ctrl+C` detiene el experimento y Chaos Toolkit ejecuta los rollbacks. El control `safeguards` lo aborta solo si `/health` deja de responder 200.
