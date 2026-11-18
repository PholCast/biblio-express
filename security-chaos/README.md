# security-chaos — experimentos de Caos de Seguridad como código (biblio-express)

Contiene el **Exp. 3 (telemetría y capa de IA)** de Phol, la detección como código y la parte de
Phol del **Exp. 4** (copia aislada). Los Exp. 1 y 2 viven en los repositorios de Neithan
(Pokenetes-API) y Daniela (HospitalineD).

## Prerrequisitos
`gcloud` (con `gcloud auth login` y `gcloud auth application-default login`), `terraform` >= 1.6,
`node` >= 22, `pnpm` y `curl`. Todo corre en Git Bash. Copiar `gameday.env.example` a `gameday.env`
(URLs e IDs, sin secretos; el real está en `.gitignore`).

## Estructura
| Ruta | Qué es |
|---|---|
| `lib/gameday.sh` | Bitácora, marcador en la nube, `x-trace-id` de la corrida e interruptor de parada |
| `lib/normal-traffic.sh` | Tráfico normal del flujo (caso negativo de cada regla) |
| `exp3-telemetria-ia/` | `experiment.yaml` (hipótesis), `steady-state.sh`, `inject.sh`, `rollback.sh`, `stop.sh`, `measure.sh`, `run-operator-round.sh` |
| `ai-assistant/` | Asistente SOC con Gemini en Vertex AI: v0 ingenuo, v1 endurecido, aprobaciones y pruebas |
| `detections/` | `lib.sh` y `tests/<regla>/{positive,negative}.sh` con su `last-run.log` |
| `terraform/` | Raíz **aislada** (estado propio): reglas `gd3-*`, Pub/Sub, latido, bitácora inmutable, copia WORM, cuenta del asistente y tablero |
| `evidence/expN/ronda-R/` | `bitacora.jsonl`, `alerts.json`, `events.jsonl` y `results.json` de las tres rondas de cada integrante |

## Reproducir el Exp. 3
```bash
cd security-chaos/terraform && terraform init && terraform apply     # reglas, canales y bitácora (irreversible: retención bloqueada)
cd ../exp3-telemetria-ia
./steady-state.sh                       # estado estable -> evidence/exp3/estado-estable.json
./inject.sh 0 1 20                      # ronda 0: cegar telemetría 20 min (reversión automática al final)
./run-operator-round.sh 1 1 12          # ronda 1: inyecta, espera la alerta, contiene y mide
GD_ROUND=1 GD_RUN=1 ./measure.sh        # MTTD/MTTC -> results.json
cd ../ai-assistant && pnpm install --ignore-workspace
node run-injection-test.mjs --mode=v1 --round=1    # inyección en el título de un libro sintético
```
**Parada:** `./stop.sh` (crea `security-chaos/STOP` y revierte) o `GAMEDAY_STOP=1`.
**Reversión:** `./rollback.sh` quita la exclusión `gd3-blind`, rehabilita la alerta 5xx y verifica que
vuelve un log nuevo del servicio. Es idempotente.

## Tests de detección
`detections/tests/<regla>/positive.sh` dispara la alerta con la condición adversa y
`negative.sh` comprueba que el tráfico normal no la dispara. Salida en `last-run.log`.

## Exp. 4 (parte de Phol)
La copia aislada es un bucket con retención de 7 días **bloqueada** (WORM) y un *transfer job* sin
programación: se dispara a mano con `gcloud transfer jobs run <job>` en el paso 2 de la secuencia.
