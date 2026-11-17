# Análisis de los experimentos con un agente de IA

El grupo usó **Claude Code** (Anthropic, modelo Claude Opus) como agente de análisis. El agente tuvo acceso de solo lectura a:

- los tres repositorios;
- los logs de Cloud Run del proyecto `biblio-express-final-2026`, con `gcloud logging read`;
- el stack de Grafana Cloud: Tempo y la definición del tablero.

No modificó la infraestructura ni el tablero de los compañeros. Tampoco ejecutó los experimentos: las rondas las corrió cada integrante desde su pipeline. Todos los números de este documento salen de logs, trazas o métricas, y se pueden volver a consultar con los filtros indicados. Horas en UTC, 16 de noviembre de 2026.

## 1. Correlación de trazas

En Tempo, la traza `34b973d832c61cb6e237f1c8736be547` (`x-trace-id: informe-neithan-1`) es una ejecución de `GET /api/v5/flujo` sin fallo:

| Servicio | Span | Inicio | Duración |
|---|---|---|---|
| `pokenetes-api` | `GET /api/v5/flujo` | +0 ms | 293 ms |
| `pokenetes-api` | Abrir conexión y consultar el Pokémon | +0 ms | 40 ms |
| `biblio-express-final` | `GET /api/v5/books/last` | +87 ms | 44 ms, de los que 34 ms son abrir la conexión a PostgreSQL |
| `hospitaline-api` | `GET /api/v5/hospitals/last` | +194 ms | 87 ms, de los que 56 ms son abrir la conexión a PostgreSQL |

**Qué muestra:**

- Las llamadas son secuenciales y sus tiempos se suman. Por eso los 2000 ms de F1 se trasladan completos al flujo: es el acoplamiento de latencia que refutó la Ronda 0 de Neithan. La traza es una petición aislada y dura más que el p95 bajo carga (152 a 177 ms en la línea base de sus rondas), porque tuvo que abrir conexiones nuevas.
- Entre el fin de la consulta en AWS (+40 ms) y el inicio del span en Cloud Run (+87 ms) pasan unos 47 ms: es el salto de red y TLS de `us-east-1` a `us-central1`.
- En las dos dependencias, abrir la conexión a la base pesa más que la consulta (34 ms frente a 6 ms, y 56 ms frente a 11 ms). La traza es una petición aislada, sin más tráfico, y el pool de `pg` cierra las conexiones que pasan 10 s sin uso. Bajo carga las conexiones se reutilizan, así que esto pesa en la primera petición después de una pausa, no en las rondas.

## 2. Correlación de métricas y logs entre nubes

Para ver el efecto de cada fallo desde la API que lo recibe, el agente cruzó las ventanas de inyección de Neithan y Daniela con los logs de biblio-express.

### Fallo de Neithan visto desde biblio-express

Filtro: peticiones de Cloud Run a `/api/v5/books`, de 17:00 a 17:32.

| Momento | Llamadas a `/api/v5/books/last` | Lectura |
|---|---|---|
| Ronda 0, antes del fallo (17:06) | 1385 por minuto | Flujo normal |
| Ronda 0, en el fallo (17:07) | 455 por minuto | Cada flujo espera 2000 ms antes de llamar, así que llegan menos llamadas |
| Ronda 1, antes del fallo (17:25:00 a 17:25:12) | Unas 30 por segundo | Flujo normal |
| Ronda 1, en el fallo (17:25:13 a 17:27:18) | Ráfagas de 9 a 20 llamadas cada 15 s, a las 17:25:15, :31, :46, 17:26:02, :17, :33, :48 y 17:27:04. Solo 55 en todo el minuto 17:26 | El circuit breaker abierto: la coordinadora deja de llamar y lo reintenta cada 15 s |
| Ronda 1, después (17:27:18 en adelante) | Unas 30 por segundo | El circuito se cierra |

Hallazgos de esta correlación:

- **El fallo de Neithan no degradó a biblio-express.** En el minuto del fallo de la Ronda 0, el p95 del servidor para `/books/last` fue de 16 ms. Los 2 s que midió k6 están completos en la coordinadora, y el fallo quedó dentro de su radio de impacto.
- **El circuito de Neithan reduce la carga sobre biblio-express en más de un 95 %**, y su ciclo de 15 s se ve en los logs del servicio llamado.
- **Al reabrirse, el circuito deja pasar una ráfaga** de 9 a 20 llamadas en lugar de una sola de prueba. El circuit breaker no tiene estado semiabierto (*half-open*): todas las peticiones concurrentes pasan antes de que se registren los tres fallos.

### Fallo de Daniela visto desde biblio-express

Filtro: peticiones de Cloud Run a `/api/v5/users`, de 22:45 a 23:12.

- **Ninguna llamada llegó a biblio-express durante las dos ventanas de fallo:** no hubo llamadas entre 22:56:08 y 22:58:34 en la Ronda 0, ni entre 23:02:19 y 23:04:44 en la Ronda 1. El `503` de F2 se fabrica dentro de Hospitaline (`chaosFetch`) y no sale de su radio de impacto.
- **Fuera del fallo, las llamadas llegan en ráfagas de 8 a 16 cada 30 s**, aunque k6 envía unas 35 peticiones por segundo a Hospitaline. La caché de peers (TTL de 30 s) absorbe casi toda la carga. Cuando vence, varias peticiones concurrentes salen a la vez hacia el peer: no hay coalescencia de peticiones.

### Fallo de Phol

El agente cruzó cuatro fuentes:

- el journal de Chaos Toolkit;
- los eventos `chaos_fault_*` de Cloud Logging;
- las métricas de Cloud Monitoring: conexiones de Cloud SQL, latencia y 5xx de Cloud Run;
- los `x-trace-id` de k6.

Con eso reconstruyó el mecanismo de la Ronda 0, en el informe, sección 5:

1. El pool se queda sin conexiones libres.
2. Cada petición espera sin límite una conexión.
3. Cloud Run corta las peticiones a los 60 s.
4. Se satura la concurrencia de la instancia y cae `/health`.

En la Ronda 1 encontró dos efectos sobre el flujo integrado:

- **`503` en `/books/last`:** las tres llamadas de la coordinadora lo recibieron porque la caché arrancó vacía con la revisión nueva.
- **`500` en el listado:** 1 s después de cada `503` llegó un `GET /api/v5/books` que terminó en `500`. Coincide con el reintento de la coordinadora sobre el listado.

## 3. Propuestas: qué se adoptó y qué se descartó

| Propuesta del agente | Decisión | Por qué |
|---|---|---|
| Medir los tres experimentos con un solo generador k6, con fases (`baseline`, `fault`, `recovery`) y cabeceras solo en la ventana de fallo | Adoptada | Las seis rondas quedan comparables: misma carga, misma ventana y mismo instrumento |
| Para el pool de Phol, usar como métrica el presupuesto de error consumido | Adoptada | El fallo impide la respuesta, no la vuelve lenta |
| Usar el throughput o el MTTR como métrica de Phol | Descartada | El throughput cae con el timeout de 1 s aunque no se pierda ninguna respuesta, y la recuperación es inmediata en ambas rondas |
| Hipótesis de Phol: 10 de 10 conexiones durante 2 min, presupuesto ≤ 100 % | Adoptada | Es falsable y está en la forma que pide el enunciado |
| Timeout de adquisición del pool y caché de respaldo (Phol) | Adoptada | Corrigen los pasos 2 y 3 del mecanismo de la Ronda 0 |
| Timeout de adquisición de 500 ms | Descartada | Hacía fallar peticiones sanas: abrir una conexión nueva tarda más. La traza lo confirma: 34 ms en reposo y más bajo carga |
| Chaos Mesh para el fallo de Phol | Descartada | Cloud Run no es Kubernetes |
| Circuit breaker y bulkhead sobre la base de Phol en esta entrega | Al backlog | El diagnóstico apuntaba primero a la espera sin límite |
| Reintentos con retroceso en la llamada de la coordinadora al libro | Descartada | Cada reintento volvería a esperar los 2000 ms de F1 y crearía una tormenta de reintentos |
| Llamar al libro y al hospital en paralelo | Descartada | Ahorraría unos 90 ms según la traza, pero el enunciado pide una invocación en cadena |
| Repetir la Ronda 1 de Phol tras encontrar los `503` y `500` del flujo integrado | Descartada | Cambiar el código antes de repetirla rompería la comparación con la Ronda 0. Queda como hallazgo y en el backlog |
| Atribuir con certeza los `500` del listado a la coordinadora | Descartada | Esas peticiones no traen `x-trace-id`. Se informan como coincidencia de tiempos |
| Estado semiabierto en el circuit breaker de la coordinadora, con una sola llamada de prueba | Propuesta para el backlog | Evita la ráfaga de 9 a 20 llamadas en cada reapertura |
| Coalescencia de peticiones en la caché de peers de Hospitaline | Propuesta para el backlog | Evita que 8 a 16 peticiones salgan juntas cuando vence la caché |
| Mantener un mínimo de conexiones abiertas en los pools de las dependencias | Propuesta para el backlog, de baja prioridad | Solo mejora la primera petición después de una pausa; bajo carga las conexiones ya se reutilizan |

## 4. Límites

- La IA propuso hipótesis, métricas y patrones, y encontró correlaciones. Las decisiones finales y las ejecuciones de las rondas son del grupo.
- Lo que el agente afirma sale de datos que se pueden consultar: la traza en Tempo, los logs de Cloud Run con los filtros indicados y los resúmenes de k6. Cuando no hubo identificador para unir dos eventos, se dijo explícitamente.
