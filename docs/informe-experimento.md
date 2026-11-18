# Informe de experimentos de Ingeniería del Caos

**Grupo:** Phol Castañeda (GCP, Cloud Run), Neithan Gómez (AWS) y Daniela Higuita (GCP, Kubernetes).
**Materia:** ÉNFASIS I: DEFENSA EN PROFUNDIDAD. **Profesor:** José Fabio Jaramillo.
**Entrega final:** 18 de noviembre de 2026. **Versión:** `v5.0.0`. Versión en PDF: [`informe-experimento.pdf`](informe-experimento.pdf).
**Repositorios:** Phol: [github.com/PholCast/biblio-express](https://github.com/PholCast/biblio-express) · Neithan: [github.com/Enedev/Pokenetes-API](https://github.com/Enedev/Pokenetes-API) · Daniela: [github.com/Dhani-dev/HospitalineD](https://github.com/Dhani-dev/HospitalineD).

## 1. Flujo y alcance

El flujo es síncrono. La carga entra por `GET /api/v5/flujo` de la API coordinadora de Neithan (AWS: ALB, EC2 y RDS), que lee su último Pokémon y llama en serie a `GET /api/v5/books/last` de biblio-express (Phol, Cloud Run) y a `GET /api/v5/hospitals/last` de Hospitaline (Daniela, GKE Autopilot). `x-trace-id` y `traceparent` viajan en las tres llamadas, y las tres API devuelven el mismo `trace-id`. El diagrama con los puntos de inyección, el radio de impacto y los puntos de medición está en el [README](https://github.com/PholCast/biblio-express#diagrama-del-flujo-puntos-de-inyección-y-medición).

Cada integrante inyectó un fallo distinto sobre su propia infraestructura, con datos sintéticos, el 16 de noviembre de 2026. Las rondas empezaron a estas horas UTC: Phol a las 05:54 y 06:23, Neithan a las 17:03 y 17:22, y Daniela a las 22:53 y 23:00.

| Integrante | Fallo | Experimento declarativo | Métrica objetivo (k6, ventana de 120 s) | Umbral | Patrones |
|---|---|---|---|---|---|
| Neithan | (a) +2000 ms en la llamada saliente a biblio-express | `chaos/neithan-latency.yaml`, interruptor `x-peer-latency-ms` | p95 de `GET /api/v5/flujo` | ≤ 800 ms | Timeout de 300 ms y circuit breaker |
| Daniela | (b) biblio-express responde `503` al 100 % | `chaos/daniela-dependency-5xx.yaml` (Chaos Toolkit), interruptor `x-fault-mode` | Tasa de error de `GET /api/v5/hospitals/:id` | ≤ 1 % | Degradación elegante y circuit breaker |
| Phol | (c) 10 de 10 conexiones del pool retenidas | `chaos/experiments/pool-exhaustion.yaml` (Chaos Toolkit), interruptor `/chaos/pool-exhaustion` | Presupuesto de error consumido en `GET /api/v5/books/:id` (SLO 95 %) | ≤ 100 % | Timeout de adquisición del pool y caché de respaldo |

Cada métrica se mide en el endpoint del propio integrante, para que el resultado dependa solo de su fallo. Cada experimento corre como puerta de calidad en su pipeline: las tres Rondas 0 dejaron el job en rojo y las tres Rondas 1 en verde.

## 2. Perfil de carga común

`perfil-comun-v1` (k6, `load/profile.json` y `load/k6/flow.js`). Los workflows de Neithan y Daniela lo descargan del commit `7b2aef79`, así que las seis rondas usan la misma carga y el mismo instrumento.

| Concurrencia | Duración | Escalones | Ventana de inyección |
|---|---|---|---|
| Hasta 20 usuarios virtuales | 5 min 30 s | 0→10 (30 s), 10 (60 s), 10→20 (30 s), 20 (180 s), 20→0 (30 s) | Segundos 150 a 270 |

k6 etiqueta cada petición con su fase (`baseline`, `fault`, `recovery`). Las cabeceras de `FAULT_HEADERS` solo se envían en la ventana de fallo, así que quitarlas al segundo 270 es también la reversión de los fallos activados por cabecera.

## 3. Neithan: latencia en la llamada saliente

**Estado estable:** fase `baseline` de las dos ejecuciones del gate, con 100 % de éxito y p95 de 152,1 ms en la Ronda 0 (2860 peticiones) y de 177,0 ms en la Ronda 1 (2713 peticiones).

**Hipótesis:** dado `perfil-comun-v1`, cuando se inyecten 2000 ms en la llamada a `GET /api/v5/books/last` durante 120 s, el p95 de `GET /api/v5/flujo` se mantendrá bajo 800 ms.

- **Métrica:** `http_req_duration{phase:fault}`, p95, medido por k6.
- **Método:** k6 envía `x-peer-latency-ms: 2000` en la ventana de fallo, y la coordinadora duerme ese tiempo antes de llamar a biblio-express.
- **Radio de impacto:** solo esa llamada. El Pokémon y el hospital no esperan.
- **Aborto:** el `/health` de la coordinadora falla, o el p95 de toda la ventana supera 5000 ms.
- **Reversión:** quitar la cabecera; la siguiente petición ya no espera.

**Ronda 0** (sin las protecciones nuevas; se conserva el corte de 5 s de `fetch`): p95 de **2147 ms** en 920 peticiones, todas con `200`. La hipótesis se refuta. El modo de fallo es **acoplamiento de latencia**, no una cascada de errores:

1. La coordinadora duerme 2000 ms antes de llamar a biblio-express.
2. Como 2000 ms caben dentro del corte de 5 s, la llamada termina y el flujo responde `200`.
3. Las llamadas son secuenciales, así que la espera de un compañero se suma a la de todo el flujo: k6 midió 2147 ms y el p95 del balanceador en CloudWatch fue de 2,14 s en ese minuto.

**Mejoras, elegidas a partir del diagnóstico:**

| Patrón | Qué corrige |
|---|---|
| Timeout de 300 ms alrededor de la llamada al libro, que cubre también el retraso | La coordinadora deja de esperar la dependencia lenta |
| Circuit breaker: abre tras 3 fallos y queda abierto 15 s | Mientras está abierto, deja de llamar a la dependencia y no paga ni los 300 ms |

Los reintentos se descartaron: cada uno volvería a dormir los 2000 ms y armaría una tormenta de reintentos. Las protecciones se activan con `x-peer-resilience: true`.

**Ronda 1:** p95 de **146 ms** en 3898 peticiones, todas con `200`; la hipótesis se cumple. Con las dos cabeceras, el paso `books` sale `live: false` con `error: timeout` y, tras tres fallos, con `circuit_open`, mientras `hospitals` sigue `live: true`. Una petición de diagnóstico con las dos cabeceras respondió `200` en 684 ms.

## 4. Daniela: indisponibilidad de una dependencia

**Estado estable:** fase `baseline` de las dos ejecuciones del gate, con 0 % de error y p95 de 69,7 ms en la Ronda 0 (3206 peticiones) y de 51,8 ms en la Ronda 1 (3262 peticiones).

**Hipótesis:** dado `perfil-comun-v1`, cuando biblio-express responda `503` en el 100 % de las llamadas durante 120 s, `GET /api/v5/hospitals/:id` mantendrá la tasa de error en 1 % o menos.

- **Métrica:** `http_req_failed{phase:fault}` (estado ≥ 400), medida por k6.
- **Método:** k6 envía `x-fault-mode: dependency-down` en la ventana de fallo. El cliente saliente de Hospitaline responde `503` en lugar de llamar a `GET /api/v5/users` de biblio-express, así que la petición no llega a Phol. El archivo de Chaos Toolkit inyecta el mismo fallo con `PUT /chaos/dependency-5xx`, que guarda una clave en Redis con un máximo de 900 s.
- **Radio de impacto:** solo la llamada de `/api/v5` hacia biblio-express. Quedan fuera v1 a v4, Cloud SQL y la llamada a Pokenetes.
- **Aborto:** `/health` deja de responder `200` (comprobación cada 5 s).
- **Reversión:** la cabecera desaparece al terminar la ventana. Con el interruptor, `DELETE /chaos/dependency-5xx`, y la clave vence sola a los 180 s.

**Kubernetes:**

- `hospitaline-api` corre en el namespace `hospitaline-prod` con 2 réplicas y `maxUnavailable: 0`.
- Probes: liveness y readiness en `/health`, cada 15 s y cada 10 s.
- Recursos: requests de 250m de CPU y 512Mi; limits de 500m y 1Gi.

**Ronda 0** (sin `x-peer-resilience`): la tasa de error en la ventana fue **100 %** (4342 peticiones), con 0 % en la línea base y en la recuperación. La hipótesis se refuta. El modo de fallo es una **cascada**:

1. k6 envía la cabecera del fallo sin la de resiliencia.
2. Hospitaline recibe `503` en la llamada saliente a biblio-express.
3. Ese `503` se propaga y `GET /api/v5/hospitals/:id` responde `503`, aunque los datos propios del hospital estaban disponibles.
4. El error no tarda: el p95 en la ventana fue de 66,7 ms. Por eso el daño se ve en la tasa de error y no en la latencia.

Al terminar la ventana, la recuperación vuelve a 0 %.

**Mejoras:**

| Patrón | Qué corrige |
|---|---|
| Degradación elegante | Ante la falla del peer responde `200` con `X-Degraded: biblio-express` y el peer en `live: false`, en lugar de propagar el `503` |
| Circuit breaker en memoria de cada pod: abre tras 5 fallos y queda abierto 30 s | Deja de llamar a la dependencia caída mientras está abierto |

**Ronda 1:** tasa de error **0 %** en la ventana (4160 peticiones), con un p95 de 94,0 ms. La hipótesis se cumple.

## 5. Phol: agotamiento del pool de conexiones

**Estado estable**, medido en la calibración con el mismo perfil: 100 % de éxito en 3018 peticiones, p95 de 108,4 ms y p99 de 155,0 ms. Declarado: éxito ≥ 99 % y p95 ≤ 150 ms. En reposo, Cloud SQL tiene unas 2 conexiones abiertas.

**Hipótesis:** dado `perfil-comun-v1`, cuando se retengan 10 de las 10 conexiones del pool de PostgreSQL durante 2 minutos, biblio-express no consumirá más del 100 % de su presupuesto de error en la ventana de inyección. El SLO es 95 % de peticiones exitosas en `GET /api/v5/books/:id`.

- **Métrica:** tasa de error (`http_req_failed{phase:fault}`) ÷ 5 % × 100. Instrumento: k6. Ventana: 120 s.
- **Por qué esta métrica:** el agotamiento del pool no vuelve lenta la respuesta, la impide. Se descartaron dos alternativas:
  - El throughput, porque cae con el timeout de 1 s aunque no se pierda ninguna respuesta.
  - El MTTR, porque la recuperación es inmediata en ambas rondas.
- **Método:** Chaos Toolkit llama a `POST /chaos/pool-exhaustion` con `hold: 10` y `durationSeconds: 120`. El interruptor toma las conexiones una por una y no las devuelve.
- **Radio de impacto:** los endpoints de biblio-express que usan la base de datos. Quedan fuera `/health`, la instancia de Cloud SQL y las otras API.
- **Aborto:** `/health` distinto de `200` (control `safeguards`) o interrupción manual.
- **Reversión automática:** el temporizador del interruptor, los rollbacks de Chaos Toolkit y un tope de 300 s.
- **Ejecución:** el workflow `chaos-experiment.yml` corre la calibración y las dos rondas, y falla si la métrica supera el umbral.

**Reversión probada antes de la primera ejecución** (15 de noviembre, UTC). Evidencia: los eventos `chaos_fault_started` y `chaos_fault_stopped` en Cloud Logging.

- **Apagado automático:** un fallo de 30 s iniciado a las 21:11:37 terminó a las 21:12:07 con `reason: auto-revert`.
- **Apagado manual:** un `DELETE` a las 21:14:39 terminó el fallo con `reason: manual`.
- **Petición durante el fallo:** `GET /api/v5/books/1` esperó 55,38 s, hasta el apagado automático.
- **Vuelta al estado estable:** la misma petición respondió `200` en 0,39 s.

**Ronda 0** (`DB_POOL_ACQUIRE_TIMEOUT_MS=0`, `STALE_CACHE_ENABLED=false`; se mantienen el timeout de 60 s de Cloud Run, `/health` sin base de datos y la instancia mínima). El fallo estuvo activo de 05:56:44 a 05:58:44.

| Fase (k6) | Peticiones | Éxito | p95 |
|---|---|---|---|
| Línea base | 3011 | 100 % | 123 ms |
| Fallo | 241 | 8,7 % | 10 001 ms (timeout de k6) |
| Recuperación | 1427 | 100 % | 139 ms |

Se consumió el **1825,73 %** del presupuesto (220 errores de 241), así que la hipótesis se refuta. El modo de fallo es el **agotamiento del pool con timeouts demasiado largos**, que escaló a la saturación del límite de concurrencia:

1. Con las 10 conexiones retenidas, Cloud SQL pasa de unas 2 conexiones a una meseta de 12.
2. Sin timeout de adquisición, cada petición espera indefinidamente en la cola del pool. En Cloud Logging no hay llamadas completadas durante la ventana; al liberarse el pool se completan unas 640 en 10 s.
3. k6 abandona cada petición a los 10 s, pero en el servidor sigue viva hasta los 60 s de Cloud Run: la latencia del servidor llega a 1,07 min y los 5xx a cerca del 85 %.
4. Las peticiones abandonadas se acumulan hasta pasar el límite de 80 peticiones simultáneas de la instancia. Desde las 05:57:23, `/health` deja de responder: **el fallo salió del radio de impacto**.
5. La condición de aborto actuó: a las 05:57:40 `safeguards` detuvo el experimento. El interruptor se revirtió solo a las 05:58:44.

En el flujo integrado, la coordinadora esperó 10,3 s por `/books/last` en las tres llamadas de prueba (`cascada-ronda-0-*`).

**Mejoras:**

| Patrón | Qué corrige |
|---|---|
| Timeout de adquisición del pool, 1000 ms (`src/config/db-pool.js`) | La espera sin límite del paso 2 |
| Degradación con caché (`src/resilience/`): los getById y los `/last` de v5 devuelven su última copia correcta con `X-Degraded: stale-cache`; sin copia, `503` con `Retry-After` | La pérdida de la respuesta cuando no hay conexión |

**Ronda 1** (fallo de 06:25:43 a 06:27:43; experimento `completed` y las 32 comprobaciones del estado estable cumplidas):

| Fase (k6) | Peticiones R0 → R1 | Éxito R0 → R1 | p95 R0 → R1 |
|---|---|---|---|
| Línea base | 3011 → 2915 | 100 % → 100 % | 123 → 130 ms |
| Fallo | 241 → 1507 | 8,7 % → 100 % | 10 001 → 1118 ms |
| Recuperación | 1427 → 1493 | 100 % → 100 % | 139 → 170 ms |

El presupuesto consumido es **0 %**, así que la hipótesis se cumple. Cada petición espera 1 s y recibe la copia en caché (unas 1500 respuestas degradadas), y `/health` respondió todo el tiempo. El costo es cerca de 1 s de latencia mientras dura el fallo.

## 6. Comparación consolidada

| Integrante | Métrica objetivo | Ronda 0 | Ronda 1 | Variación | Hipótesis |
|---|---|---|---|---|---|
| Neithan | p95 de `/api/v5/flujo` (≤ 800 ms) | 2147 ms | 146 ms | −93,2 % | Refutada → cumplida |
| Daniela | Tasa de error de `/api/v5/hospitals/:id` (≤ 1 %) | 100 % | 0 % | −100 % | Refutada → cumplida |
| Phol | Presupuesto de error consumido (≤ 100 %) | 1825,73 % | 0 % | −100 % | Refutada → cumplida |

**Tablero:** el tablero del grupo en Grafana Cloud tiene una fila por integrante. Cada fila muestra la ventana de inyección y la métrica objetivo, con datos leídos de las fuentes:

| Fila | Fuente | Rango UTC con las dos rondas |
|---|---|---|
| Neithan | CloudWatch: balanceador y métricas EMF de la API | [17:00 a 17:30](https://vibrantkinkajou470.grafana.net/d/datbmrl/caos-del-grupo-e28094-tres-nubes?from=2026-11-16T17:00:00.000Z&to=2026-11-16T17:30:00.000Z&timezone=utc) |
| Daniela | Cloud Monitoring de su proyecto (PromQL de Managed Prometheus) | [22:50 a 23:10](https://vibrantkinkajou470.grafana.net/d/datbmrl/caos-del-grupo-e28094-tres-nubes?from=2026-11-16T22:50:00.000Z&to=2026-11-16T23:10:00.000Z&timezone=utc) |
| Phol | Cloud Monitoring | [05:40 a 06:40](https://vibrantkinkajou470.grafana.net/d/datbmrl/caos-del-grupo-e28094-tres-nubes?from=2026-11-16T05:40:00.000Z&to=2026-11-16T06:40:00.000Z&timezone=utc) |

Capturas de cada fila con sus dos rondas: [Neithan](evidencias/grafana-neithan-rondas.png), [Daniela](evidencias/grafana-daniela-rondas.png) y Phol ([ventana de inyección, métrica objetivo, mecanismo y patrón](evidencias/grafana-phol-dos-rondas-1.png); [saturación de la instancia](evidencias/grafana-phol-dos-rondas-2.png)).

**Traza de extremo a extremo:** en Tempo, el trace id `34b973d832c61cb6e237f1c8736be547` (`x-trace-id: informe-neithan-1`) reúne los spans de `pokenetes-api`, de biblio-express y de `hospitaline-api`.

## 7. Hallazgos inesperados

**Neithan:**

- Las dos rondas respondieron `200`: el daño fue la espera, no el error.
- La Ronda 1 tiene más peticiones (3898 frente a 920) porque, con los mismos 20 usuarios, cada respuesta termina antes.
- En la ventana de fallo de la Ronda 1, el p95 (146 ms) quedó por debajo de la línea base de esa misma ronda (177 ms). Con el circuito abierto, el flujo omite la llamada al libro: la mejora de latencia se paga con una respuesta parcial.
- El timeout de 300 ms no cubre la llamada al hospital.

**Daniela:**

- La caché de peers devolvía un usuario vivo y ocultaba el `503`. Se corrigió en `5.0.4`: la caché se salta mientras el fallo está activo.
- Matar un pod no habría refutado la hipótesis, porque ya hay 2 réplicas y probes. Por eso se eligieron los 5xx sostenidos.
- El panel de Grafana marca 91,1 % y no 100 %, porque `rate[2m]` mezcla la línea base con la ventana de fallo.

**Phol:**

- Antes de las rondas:
  - un timeout de adquisición de 500 ms rompía peticiones sanas y se subió a 1000 ms;
  - tomar las 10 conexiones en paralelo solo retenía 9;
  - `/books/last` no tenía respaldo.
- En la Ronda 0, el fallo salió del radio de impacto: las peticiones colgadas saturaron la instancia y tumbaron `/health`. La condición de aborto lo detectó.
- En la Ronda 1, la caché no protegió al flujo integrado. Las tres llamadas de la coordinadora (`cascada-ronda-1-*`) recibieron `503` en `/books/last`: la revisión nueva arrancó con la caché vacía y k6 solo había llenado `book:1`.
- Alrededor de 1 s después de cada `503` llegó un `GET /api/v5/books` sin `x-trace-id`, que respondió `500` con `timeout exceeded when trying to connect`. Coincide con el reintento de la coordinadora sobre el listado, que no tiene caché.
  - Fueron 6 respuestas 5xx en la ventana, todas fuera del endpoint medido.
  - Para todo el servicio, equivalen a cerca del 5 % del presupuesto en Cloud Run.

## 8. Backlog de resiliencia

| Integrante | Hallazgo pendiente | Propuesta |
|---|---|---|
| Neithan | La llamada al hospital no tiene plazo | El mismo timeout de 300 ms. Sin reintentos, porque cada uno volvería a esperar |
| Daniela | El clúster sigue en `v5.0.4`, sin el contador `hospitaline_flow_requests_total` | Publicar la imagen que lo expone |
| Phol | La caché arranca vacía con cada revisión y solo cubre identificadores ya consultados | Precalentar las entradas del flujo (`/last`) o usar una caché compartida (Memorystore) |
| Phol | El listado `GET /api/v5/books` responde `500` cuando vence el timeout del pool | Degradar también el listado y responder `503` con `Retry-After` ante cualquier timeout; propagar `x-trace-id` en todas las llamadas de la coordinadora |
| Phol | Las peticiones sin copia siguen esperando 1 s antes del `503` | Circuit breaker sobre la base de datos y bulkhead con rechazo temprano |
| Phol | Las peticiones abandonadas viven 60 s en el servidor | Alinear el timeout de Cloud Run con el del cliente y cancelar la espera del pool cuando el cliente se desconecta |
| Phol | Una sola instancia y un solo pool; llamadas a doctor y pokémon sin timeout | Escalado horizontal con pools más pequeños y timeout por dependencia |
| Phol | Las alertas de 5xx y p95 no se dispararon: evalúan ventanas más largas que el fallo de 2 min | Alertas sobre la tasa de consumo del presupuesto (burn rate) |

## 9. Uso de IA

**Herramienta:** Claude Code (Anthropic) como agente de análisis, con acceso de solo lectura a los tres repositorios, a los logs de Cloud Run de biblio-express y a Grafana Cloud (Tempo y tablero). El detalle está en [`docs/analisis-ia.md`](analisis-ia.md).

| Uso | Qué encontró o propuso |
|---|---|
| Correlación de trazas | Traza `34b973d8…` (293 ms): llamadas secuenciales (libro 44 ms, hospital 87 ms, unos 47 ms de red de AWS a GCP). Explica por qué los 2000 ms de F1 pasan completos al flujo |
| Correlación de métricas entre nubes | En la Ronda 1 de Neithan, biblio-express pasó de unas 30 llamadas por segundo a ráfagas de 9 a 20 cada 15 s: el circuito actuando, visto desde la dependencia. En la Ronda 0, el p95 del servidor de `/books/last` siguió en 16 ms. En las ventanas de Daniela no llegó ninguna llamada a `/api/v5/users`: F2 no salió de su radio |
| Hipótesis y métricas | Perfil k6 por fases común a los tres; para Phol, presupuesto de error en lugar de throughput o MTTR |
| Patrones | Timeout de adquisición y caché de respaldo (adoptados). Para el backlog: estado semiabierto en el breaker de Neithan, que hoy deja pasar ráfagas al reabrir; y coalescencia en la caché de Daniela, que hoy libera 8 a 16 llamadas juntas cada 30 s |

**Descartado:** reintentos en la llamada al libro, porque cada uno repetiría los 2000 ms (tormenta de reintentos); llamar al libro y al hospital en paralelo, que ahorraría unos 90 ms pero rompe la invocación en cadena que pide el enunciado; un timeout de adquisición de 500 ms, que rompía peticiones sanas; Chaos Mesh, porque Cloud Run no es Kubernetes; repetir la Ronda 1 de Phol tras los `503` del flujo, porque rompería la comparación; y atribuir con certeza los `500` del listado a la coordinadora, porque no traen `x-trace-id`.

Las decisiones y las ejecuciones son del grupo; la IA no produjo las mediciones.

## 10. Evidencias

| Integrante | Calibración y rondas (GitHub Actions) | Resultados |
|---|---|---|
| Neithan | Ronda 0 en rojo: [43914350422](https://github.com/Enedev/Pokenetes-API/actions/runs/43914350422). Ronda 1 en verde: [43917687975](https://github.com/Enedev/Pokenetes-API/actions/runs/43917687975) | Artefactos `chaos-gate-<run>` y [`chaos/resultados.md`](https://github.com/Enedev/Pokenetes-API/blob/main/chaos/resultados.md) |
| Daniela | Ronda 0 en rojo: [43974346813](https://github.com/Dhani-dev/HospitalineD/actions/runs/43974346813). Ronda 1 en verde: [43975300490](https://github.com/Dhani-dev/HospitalineD/actions/runs/43975300490) | Artefactos `k6-summary-ronda-*` y [`chaos/results/`](https://github.com/Dhani-dev/HospitalineD/tree/main/chaos/results) |
| Phol | Calibración: [43811651498](https://github.com/PholCast/biblio-express/actions/runs/43811651498). Ronda 0 en rojo: [43813169074](https://github.com/PholCast/biblio-express/actions/runs/43813169074). Ronda 1 en verde: [43816365165](https://github.com/PholCast/biblio-express/actions/runs/43816365165) | Artefactos `chaos-round-*` (journal de Chaos Toolkit, resumen de k6 y `result.json`) |

**Logs por `x-trace-id`:** en Cloud Logging de Phol, `k6-ronda-0-*`, `cascada-ronda-0-*`, `cascada-ronda-1-*`, `degraded_response` y `db_unavailable`. Neithan: eventos `peer_call` con su `trace_id`. Daniela: traza `3646da81197de2bb93c07d794319c993` de `hospitaline-api`.
