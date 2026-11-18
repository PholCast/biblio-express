# Informe del Game Day — Ingeniería del Caos de Seguridad

**Curso:** Defensa en Profundidad 2026-2 · **Fecha:** 17 de noviembre de 2026
**Grupo:** Phol (biblio-express, GCP), Neithan (Pokenetes-API, AWS), Daniela (HospitalineD, GCP/GKE)
**Arquitectura:** flujo multinube `GET /api/v5/flujo` (Pokenetes en AWS → biblio-express en Cloud Run
→ HospitalineD en GKE), correlacionado de extremo a extremo por `x-trace-id`.

> Este informe es independiente del de DevOps: allí se evaluó rendimiento y resiliencia operativa;
> aquí, la **eficacia de los controles de seguridad** (detectar, contener, resistir).

## 1. Reglas de compromiso
Detalle en `reglas-de-compromiso.md` (escritas y aceptadas antes de ejecutar la ronda 0).
- **Ventana:** jornada continua del 17 de noviembre (hora Colombia); el grupo acordó adelantar las
  franjas iniciales al tener la preparación lista. Las horas reales están en las bitácoras.
- **Recursos:** solo las cuentas del grupo (GCP `biblio-express-final-2026` y
  `project-39d0c894-3885-4211-89d`, AWS `722500516562`). Prohibido tocar terceros.
- **Datos sintéticos:** libros `GD3-SYNTH`, comprobantes `gd4-*`, señuelo sin valor.
- **Interruptor de parada:** `security-chaos/STOP` o `GAMEDAY_STOP=1`; cada experimento tiene `stop.sh`.
- **Reversión** probada antes de la primera ejecución y **bitácora** `bitacora.jsonl` correlacionada
  por trace id, con marcadores en la nube. Horas en UTC (Colombia = UTC−5).

## 2. Inventario de controles y estado estable
Inventario por capa (identidad, red, carga de trabajo, datos, detección y respuesta) con dueño,
señal y D3FEND en `inventario-controles.md`. El **estado estable** se midió antes de tocar nada
(`evidence/*/estado-estable.json`): cobertura de telemetría por capa, controles activos y línea base
de MTTD/MTTC, que es el resultado de la ronda 0. En biblio-express: logs de Cloud Run llegando a
`_Default`, 2 alertas de fiabilidad activas, **ninguna** alerta de seguridad y sin bitácora inmutable.

## 3. Hipótesis y métricas objetivo (declaradas antes de la ronda 0)
| Exp. | Responsable | Métrica objetivo | T1 detección | T2 contención |
|---|---|---|---|---|
| 1 Identidad de máquina | Neithan | MTTC | ≤ 15 min | ≤ 20 min |
| 2 Exposición y segmentación | Daniela | Cobertura de detección | ≤ 5 min | ≤ 10 min |
| 3 Telemetría y capa de IA | Phol | MTTD | ≤ 10 min | ≤ 15 min |
| 4 Resiliencia de datos (grupal) | Los tres | RTO y RPO | ≤ 10 min | RTO ≤ 30 min, RPO ≤ 60 min |

Cada hipótesis sigue la forma "dado el control C tal como está hoy, cuando ocurra la condición A,
esperamos la señal S en ≤ T1 min y la contención en ≤ T2 min" (texto completo en `hipotesis.md`).
La trazabilidad completa a ISO 27001:2022, NIST 800-53/800-207, ATT&CK v20.1, ATLAS y D3FEND, con
los IDs verificados en los sitios oficiales, está en `trazabilidad.md` y en el README.

## 4. Resultados: ronda 0 frente a ronda 1
Mismo método y mismos scripts en ambas rondas. n.d. = no detectado o no contenido en la ventana.

| Exp. | Ronda | MTTD | MTTC | Cobertura | Falsos positivos | RPO / RTO | Hipótesis |
|---|---|---|---|---|---|---|---|
| 1 | R0 | n.d. | n.d. | 0/4 | no medida | — | Refutada |
| 1 | R1 | 155 s | 17 s | 2/4 | no medida (solo fixtures) | — | Cumplida |
| 2 | R0 | n.d. | n.d. | 0/3 | — | — | Refutada |
| 2 | R1 | 22 s | 114 s | 3/3 | 0 (informado) | — | Confirmada |
| 3 | R0 | n.d. | n.d. | 1/3 | — | — | Refutada |
| 3 | R1 | 22 s | 79 s | 3/3 | 0 (3 tests negativos de 10 min, 0 alertas) | — | Confirmada |
| 4 | R0 | n.d. | 2075 s | 0/1 | — | RPO 1233 s · RTO 2075 s (34 m 35 s) | Refutada |
| 4 | R1 | 444 s | 404 s | 1/1 | 0 (informado) | Principal: RPO 0, RTO 0 · Copia: RPO 1512 s, RTO parcial 1279 s, RTO 1369 s | Confirmada |

**Lectura.** En la ronda 0 **ningún control de seguridad detectó nada**: el grupo tenía buena
observabilidad de fiabilidad (5xx, latencia) pero ninguna de seguridad. Tras las mejoras, los cuatro
experimentos detectaron y contuvieron dentro de sus umbrales; el Exp. 4 además bajó el RTO de 34 m
35 s (por encima de los 30 min) a 0 en el bucket principal y a 22 m 49 s desde la copia aislada.

**El latido no quedó demostrado (Exp. 3).** `gd3-telemetry-heartbeat-absent` no disparó en la R1; el
detector fue `gd3-telemetry-tamper`. Se probó en vivo dos veces y **no se logró verlo disparar**:
1. En el primer intento la exclusión funcionó (`_Default` dejó de recibir logs a las 04:22Z y la
   métrica llegó a 0), pero el test retiró la exclusión a los 9 min, antes de cumplirse los 300 s de
   ausencia más los ~4 min que tarda la exclusión en surtir efecto.
2. En el segundo intento (14 min) la exclusión siguió listada, pero `_Default` volvió a recibir 6 logs
   por minuto desde los ~4 min; la ausencia nunca se sostuvo 5 minutos.

Se desconoce por qué la exclusión dejó de aplicarse en el segundo intento. La regla está desplegada
y su lógica es correcta (la métrica sí cae a 0 cuando la exclusión se aplica), pero se declara como
**prueba positiva no concluyente** y como riesgo residual: hoy la detección de ceguera de telemetría
descansa en `gd3-telemetry-tamper`, que ve el cambio de configuración, no en la ausencia de datos.

**Falsos positivos y tasa base.** La tasa se calcula como alertas sin condición adversa sobre el
total de alertas, usando los `negative.sh` (10 min de tráfico normal del flujo). Con tan pocas
alertas por regla, la tasa tiene poco peso estadístico: un 0 % medido en 10 minutos no demuestra que
la regla sea precisa con otra carga o en producción (efecto de la tasa base). Neithan no corrió su
`negative.sh` en vivo (probó los filtros con fixtures), por lo que **no se declara un 0** para el
Exp. 1.

## 5. Cronología minuto a minuto (UTC)
**Exp. 1 — Neithan.** R0: 19:01:39 inicio; 19:01:56 `sts get-caller-identity` permitida con la
credencial del rol; 19:02:02 `GetSecretValue` permitida **desde fuera de AWS**; 19:02:09 no había
señuelo; 19:02:15–27 `iam list-users`, `s3 ls`, `ec2 describe-instances` denegadas; 19:03:11 sin
alarma, hipótesis refutada. R1: 01:18:35 una **pasada previa** leyó el secreto porque un apply del
pipeline dejó `enable_origin_guard` en false; 01:20:03 `gd1-honeytoken-touched` pasa a ALARM; se
restituye la guarda; 01:21:54 inicio de la pasada medida; 01:22:11 lectura **denegada** (17 s);
01:23:13 estado estable restaurado; 01:24:29 `gd1-role-secret-outside-vpce` pasa a ALARM (155 s).

**Exp. 2 — Daniela.** R0: 19:13:41 pod `gd-intruder` listo; 19:13:46–50 `redis ping`, `redis set` y
salida a Internet **abiertos**; 19:29:41 reversión; 19:29:47 verificada, sin alerta. R1: 01:16:56
`pods.create` (auditoría); 01:17:08 pod listo; 01:17:12 denegación de egreso UDP 53; 01:17:30
**`gd2-netpol-deny`** (MTTD 22 s); 01:17:32 Redis bloqueado; 01:18:01 salida bloqueada; 01:19:02
reversión verificada (pods = 0, flujo 200).

**Exp. 3 — Phol.** R0: 19:00:05 exclusión `gd3-blind` aplicada y alerta 5xx deshabilitada; 19:00–19:20
sin señal; 19:21:03 no contenido, reversión automática; 19:23:41 telemetría restaurada; fase B: el
asistente v0 reportó los 3 payloads. R1: 20:51:57 inicio; 20:52:19 **`gd3-telemetry-tamper`** (22 s);
20:52:45 reversión por el operador; 20:53:16 contenido (79 s); 20:53:35 estado estable; fase B: el
asistente v1 reportó los 3 payloads y `gd3-ai-agent-guard` disparó a las 20:55:05.

**Exp. 4 — grupal.** R0 (sin copia): 21:14:04 inicio, 50 comprobantes; sobrescrituras abiertas desde
21:14:13 (23 abiertas, 2 denegadas) y borrados abiertos desde 21:20:54 (25); 21:25:37 fin del
ataque; sin alerta; 21:46:46 10 restaurados por soft delete (RTO parcial 1962 s); 21:48:39 50
verificados (RTO 2075 s); 21:48:53 reversión verificada. R1: 02:22:22 inicio; 02:22:31 primera
sobrescritura **denegada** por la retención (25 sobrescrituras y 25 borrados denegados); 02:29:46
**`gd4-mass-object-destruction`** (444 s); 02:43:41 10 de la copia verificados; 02:45:11 40 de la
copia verificados (los 10 de la siembra posterior no están, por diseño); 02:55:12 reversión
verificada. Los 50 hashes del bucket principal nunca cambiaron.

## 6. Mejoras aplicadas (al menos dos por integrante)
| Integrante | Mejora | Defecto que corrige |
|---|---|---|
| Neithan | Autorización ligada al origen: `GetSecretValue` solo desde el VPC endpoint de Secrets Manager, con Deny en otro caso | El secreto se leía con la credencial del rol desde cualquier origen |
| Neithan | Identidad federada: GitHub Actions por OIDC y borrado de las llaves estáticas; señuelo `backup-admin` con alarma | Secretos estáticos en CI y ninguna señal ante el uso de una credencial robada |
| Daniela | Microsegmentación: NetworkPolicy de la API y de Redis | Cualquier pod llegaba a Redis |
| Daniela | Denegación por defecto y filtrado de salida, `NetworkLogging` y auditoría | Salida a Internet sin filtrar y red sin telemetría |
| Daniela | Retención de 86400 s en el bucket de comprobantes y auditoría `DATA_WRITE` | Borrado y sobrescritura libres, sin señal |
| Phol | Alerta por ausencia de señal (latido): métrica de logs con ámbito de bucket y `condition_absent` (prueba positiva no concluyente, ver §4) | Si los logs se cortaban, nadie lo notaba |
| Phol | Bitácora inmutable `gd-audit` (30 días, retención **bloqueada**) | Un atacante con permisos podía borrar la evidencia |
| Phol | Copia aislada WORM (7 días, **bloqueada**) y mitigaciones del asistente v1 | Sin copia fuera del alcance de la identidad atacada |

## 7. Detección como código
Reglas versionadas en el repositorio de cada integrante, nombradas `gd<exp>-<regla>`:
- **Phol (Cloud Monitoring, `security-chaos/terraform/`):** `gd3-telemetry-tamper`,
  `gd3-telemetry-heartbeat-absent`, `gd3-ai-agent-guard`, con `positive.sh` y `negative.sh` en
  `security-chaos/detections/tests/`. Canal medido: Pub/Sub (`gd-alerts`), más correo.
- **Neithan (CloudWatch, `terraform/security-detection.tf`):** `gd1-role-secret-outside-vpce` y
  `gd1-honeytoken-touched`. Los casos positivo y negativo son fixtures JSON que se evalúan con
  `aws logs test-metric-filter` (`security-chaos/detections/test-filter.sh`); sus salidas no están
  versionadas y no se corrió una prueba negativa en vivo.
- **Daniela (Cloud Monitoring, `terraform/gke/security-detection.tf`):** `gd2-netpol-deny`,
  `gd2-undeclared-workload` y `gd4-mass-object-destruction`. Cada regla **disparó con la condición
  adversa en la ronda 1** (prueba positiva en vivo), pero su repositorio no incluye scripts de
  prueba positivo/negativo ni un caso negativo medido.

Cada regla debe dispararse con la condición adversa y no con el tráfico normal del flujo. **Resultado de las pruebas de Phol** (`security-chaos/detections/tests/*/last-run.positive.log` y `last-run.negative.log`): los 3 casos negativos pasaron (10 min de tráfico normal, 0 alertas); de los positivos, `gd3-ai-agent-guard` y `gd3-telemetry-tamper` dispararon, y `gd3-telemetry-heartbeat-absent` quedó no concluyente (ver §4). La prueba de `tamper` falló dos veces antes de pasar porque la regla notifica como máximo una vez cada 5 minutos y los intentos se lanzaron demasiado pronto tras otro cambio de configuración; los intentos fallidos se conservan como `last-run.intento*.log`.

## 8. IA aplicada a la defensa y caos sobre la capa de IA
**IA en la defensa (humano en el bucle).** Un asistente con Gemini en Vertex AI correlacionó los 178
eventos de los cuatro experimentos en un único triage (`ia/triage-gameday.md`). Se evaluó
críticamente contra la telemetría real (`ia/evaluacion-ia.md`): de 16 afirmaciones, **5 acertó, 7
fueron inexactas u omisiones, 3 se descartaron y 1 fue inventada**. Lo más grave: omitió que las
rondas 0 no detectaron nada, fundió dos pasadas del Exp. 1, llamó "simulación" a un ataque real y
habló de "modelos de detección de IA" que no existen. Los tres integrantes revisaron sus filas.

**Caos sobre la propia capa de IA (Exp. 3, fase B).** Se inyectaron instrucciones en el **título de un
libro** que el asistente ingiere a través del flujo (3 payloads: directa, autoridad y mantenimiento).
Riesgo mapeado a **OWASP Agentic 2026 ASI01 (Agent Goal Hijack), ASI02 (Tool Misuse) y ASI03 (Identity &
Privilege Abuse)** y a **MITRE ATLAS AML.T0051.001**. Resultado: el modelo **reportó** los 3 payloads
en la R0 (v0) y en la R1 (v1); no ejecutó ninguno. Las mitigaciones v1 no dependen de esa buena
voluntad: separación entre datos e instrucciones, herramientas permitidas (lectura por defecto),
**confirmación humana** para acciones con efecto (probado: la alerta no se tocó y la aprobación se
denegó) y límites al alcance (cuenta propia `soc-assistant`, máximo de iteraciones, evento
`ai_injection_suspected`). Se repitió la prueba tras la mitigación.

## 9. Tendencias del sector implementadas
1. **Identidad de agentes de IA y privilegios de máquina no gestionados** (Phol). Fuente: Gartner,
   *Top Strategic Technology Trends for 2027*, 20-oct-2026, que predice que para 2028 el 25 % de las
   brechas empresariales se originará en el abuso de agentes de IA (consulta: 17-nov-2026; URL oficial
   por confirmar). Implementación: cuenta `soc-assistant` de mínimo privilegio, sin llaves, usada por
   impersonación; inventario en `inventario-identidades-maquina.md`.
2. **Honeytoken en el flujo** (Neithan). Fuentes: MITRE D3FEND D3-DUC Decoy User Credential y
   Canarytokens (AWS API Keys), consultadas el 17-nov-2026. Implementación: secreto señuelo y alarma
   `gd1-honeytoken-touched`, que pasó a ALARM a las 01:20:03Z en la R1.

## 10. Lecciones aprendidas, riesgos residuales y próximos experimentos
**Lecciones.** (a) Sin detección de seguridad, los cuatro experimentos pasaron inadvertidos en la R0.
(b) Una métrica de logs con ámbito de proyecto no cae al excluir los logs; hay que usar ámbito de
bucket. (c) Un apply de pipeline apagó una guarda (`enable_origin_guard`) sin que nadie lo notara
hasta la pasada previa del Exp. 1. (d) La retención convierte el ataque a los datos en un intento
denegado, pero la copia aislada sigue siendo necesaria. (e) La IA acelera el triage, pero cada
error solo se vio al contrastar con los `results.json`.

**Riesgos residuales.** Los contenedores de biblio y Pokenetes corren como root y el de Hospitaline no
declara `runAsNonRoot`; el rol de despliegue de Neithan conserva `AdministratorAccess` y la llave
root no se borró; el deployer de biblio y `grafana-cloud-reader` (con una llave estática) están
sobreprivilegiados; el egreso de biblio hacia los pares sigue abierto por HTTP; la cobertura del
Exp. 1 es 2/4 (T1552.005 y T1580 sin alarma propia); el latido de telemetría del Exp. 3 no quedó
demostrado; Daniela no versionó pruebas positivo/negativo y las de Neithan no tienen salida
versionada; en el Exp. 3
la llamada al modelo usa las credenciales del operador, no `soc-assistant`; y la retención del bucket
de comprobantes no está bloqueada.

**Próximos experimentos.** mTLS entre servicios y autenticación entre las APIs; filtrado de egreso
por FQDN; endurecer los contenedores (no-root, sistema de archivos de solo lectura); detectar
T1552.005 y T1580 en AWS; y medir el delta de las mitigaciones v1 frente a un asistente
deliberadamente vulnerable.
