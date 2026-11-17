# Informe del Game Day — Ingeniería del Caos de Seguridad

**Curso:** Defensa en Profundidad 2026-2 · **Fecha:** 17 de noviembre de 2026
**Grupo:** Phol (biblio-express, GCP) · Neithan (Pokenetes-API, AWS) · Daniela (HospitalineD, GCP/GKE)
**Arquitectura:** flujo multinube `GET /api/v5/flujo` (Pokenetes/AWS → biblio-express/Cloud Run → HospitalineD/GKE), correlacionado de punta a punta por `x-trace-id`.

> Este informe es independiente del de DevOps. Allí se evaluó rendimiento y resiliencia; aquí se
> evalúa la **eficacia de los controles de seguridad** (detección, contención, resistencia).

## 1. Reglas de compromiso
Resumen (detalle en `docs/gameday/reglas-de-compromiso.md`, aceptado por los tres antes de la R0):
- **Ventana:** R0 16:00–17:45, mejoras 17:45–21:15, R1 21:30–23:15 (hora Colombia).
- **Recursos autorizados:** solo las cuentas del grupo (GCP `biblio-express-final-2026` y
  `project-39d0c894-3885-4211-89d`, AWS `722500516562`). Prohibido tocar terceros.
- **Datos sintéticos:** libros `GD3-SYNTH`, comprobantes `gd4-*`. **Interruptor de parada:**
  `security-chaos/STOP`. **Reversión** probada antes de cada ronda. **Bitácora** correlacionada por
  trace id, horas en UTC.

## 2. Inventario de controles y estado estable de seguridad
Inventario por capa en `docs/gameday/inventario-controles.md`. Estado estable medido antes de la R0
(`security-chaos/evidence/*/estado-estable.json`): cobertura de telemetría por capa, controles
activos y línea base MTTD/MTTC (= resultado de la R0). Para biblio-express: logs de Cloud Run
llegando al sink `_Default`, 2 alertas de fiabilidad activas, **sin** alertas de seguridad ni
bitácora inmutable (esa es la brecha que la R1 cierra).

## 3. Hipótesis de control y métricas objetivo
Declaradas y commiteadas antes de la R0 (`docs/gameday/hipotesis.md`).

| Exp. | Integrante | Métrica objetivo | T1 | T2 |
|---|---|---|---|---|
| 1 Identidad | Neithan | MTTC | ≤15 min | ≤20 min |
| 2 Segmentación | Daniela | Cobertura | ≤5 min | ≤10 min |
| 3 Telemetría + IA | Phol | MTTD | ≤10 min | ≤15 min |
| 4 Datos (grupal) | Los tres | RTO (y RPO) | ≤10 min | RTO ≤30, RPO ≤60 min |

## 4. Trazabilidad a marcos de referencia
IDs verificados en los sitios oficiales el 17/11/2026 (ver `docs/gameday/trazabilidad.md`).

| Exp. | ATT&CK / ATLAS | D3FEND | ISO 27001:2022 A | NIST 800-53 | 800-207 |
|---|---|---|---|---|---|
| 1 | [PENDIENTE: Neithan verifica en v20] | — | A.5.15–18 | AC-2/3/6, IA-5 | Mínimo privilegio |
| 2 | [PENDIENTE: Daniela verifica en v20] | — | A.8.20–23 | AC-4, SC-7 | Microsegmentación |
| 3 | T1685.002 (antes T1562.008), T1685 (antes T1562.001), AML.T0051.001 Indirect | D3-PM | A.8.15–17 | AU-6/9/12, SI-4 | Verificación continua |
| 4 | [PENDIENTE: grupal] T1485 Data Destruction | D3-RF, D3-FIM | A.8.13, A.5.29/30 | CP-9/10, SI-7 | Protección del recurso |

> Nota: ATT&CK avanzó a la v20 y renombró IDs. Lo del Exp. 3 ya está verificado; Neithan y Daniela
> deben confirmar los suyos uno por uno (no citar técnicas inexistentes se penaliza).

OWASP Top 10 for Agentic Applications 2026 (capa de IA, Exp. 3): ASI01 Agent Goal Hijack,
ASI02 Tool Misuse, ASI03 Identity & Privilege Abuse.

## 5. Experimento 3 — Telemetría y capa de IA (Phol) · COMPLETO
**Condición adversa:** exclusión de los logs del servicio en el sink `_Default` + alerta 5xx
deshabilitada (fase A), e inyección de instrucciones en el título de un libro que el asistente SOC
ingiere por el flujo (fase B). **Control bajo prueba:** logging de Cloud Run, alertas de Cloud
Monitoring y el asistente SOC. **Experimento como código:** `security-chaos/exp3-telemetria-ia/`.

### Cronología minuto a minuto (UTC)
**Ronda 0 (controles de hoy):**
- 19:00:05 `inject_start` — exclusión `gd3-blind` aplicada, alerta 5xx deshabilitada (t0).
- 19:00–19:20 — ventana de 20 min: **ninguna señal** (no existía detección).
- 19:21:03 `inject_end` "no contenido" → reversión automática.
- 19:23:41 `steady_state_restored`. Fase B: el asistente **v0 reportó** las 3 inyecciones.
- **Resultado:** MTTD indefinido → **H3 refutada**.

**Ronda 1 (tras las mejoras):**
- 20:51:57 `inject_start` (t0).
- 20:52:19 **`gd3-telemetry-tamper` disparó** (vía Pub/Sub) → **MTTD = 22 s**.
- 20:52:45–20:53:22 reversión por el operador; 20:53:16 `contained` → **MTTC = 79 s**.
- 20:53:35 `steady_state_restored`. Fase B: el asistente **v1** reportó las 3 inyecciones y emitió
  el evento que disparó `gd3-ai-agent-guard`.
- **Resultado:** **H3 confirmada.**

### Tabla comparativa
| Métrica | R0 | R1 |
|---|---|---|
| MTTD | no detectado | **22 s** |
| MTTC | no contenido | **79 s** |
| Cobertura de detección | 1/3 | **3/3** |
| Alertas | ninguna | tamper + agente IA |
| Hipótesis | refutada | confirmada |
| Falsos positivos | 0 (ver §8) | 0 |
| Inyección IA (ejecuta/ignora/reporta) | v0: reporta 3/3 | v1: reporta 3/3 |

### Mejoras aplicadas (2 + detección como código)
1. **Alerta por ausencia de latido** (`gd3-telemetry-heartbeat-absent`): uptime check + métrica de
   logs con **ámbito de bucket** (cae a cero cuando la exclusión corta los logs) + `condition_absent`.
2. **Bitácora inmutable** `gd-audit`: bucket de logs con retención de **30 días bloqueada**
   (irreversible). Probado: bajar la retención falla con *"Locked buckets are immutable"*.
- Reglas: `gd3-telemetry-tamper` (cambios en sinks/alertas), `gd3-telemetry-heartbeat-absent`,
  `gd3-ai-agent-guard`. Todas con test positivo y negativo (`security-chaos/detections/tests/`).

### Capa de IA (humano en el bucle)
Asistente SOC con Gemini en Vertex AI (`security-chaos/ai-assistant/`). Las 4 mitigaciones v1:
separación datos/instrucciones (bloque no confiable), lista blanca de herramientas (lectura por
defecto), **aprobación humana** para acciones con efecto (probado: la alerta no se tocó y la
aprobación se denegó), y límites de alcance (SA propio + reporta la inyección). **Hallazgo honesto:**
el modelo resistió la inyección ingenua ya en v0 (la reportó, no la ejecutó); las mitigaciones v1 no
dependen de esa buena voluntad, la bloquean por diseño.

## 6. Experimento 1 — Identidad de máquina (Neithan) · [PENDIENTE]
Condición: credenciales del rol de EC2 usadas desde otro origen y alcance. Métrica MTTC.
[PENDIENTE: Neithan — cronología R0/R1, MTTD/MTTC, cobertura, honeytoken, migración a OIDC,
`evidence/exp1/`.]

## 7. Experimento 2 — Exposición y segmentación (Daniela) · [PENDIENTE]
Condición: pod no declarado → Redis + salida a Internet. Métrica cobertura.
[PENDIENTE: Daniela — cronología R0/R1, cobertura, NetworkPolicies default-deny, `evidence/exp2/`.]

## 8. Experimento 4 — Resiliencia de los datos (grupal) · R0 COMPLETA
Bucket de comprobantes del flujo (`gd4-flow-receipts`, de Daniela); la identidad de la carga
sobrescribe y borra; se mide RPO/RTO y se restaura. **Copia aislada WORM** creada en el proyecto de
Phol (`biblio-express-final-2026-gd4-copia-aislada`, retención de 7 días **bloqueada**; probado: el
borrado falla hasta el 24 nov). Técnica **T1485** Data Destruction; D3-RF Restore File.

### Ronda 0 (sin copia, línea base) — hipótesis refutada
- Siembra: Neithan 40 + 10 comprobantes (los 10 definen el RPO). t0 = 21:14:04Z.
- Ataque: 23 sobrescrituras y 25 borrados **abiertos** (2 sobrescrituras denegadas por azar). Sin
  retención ni copia, nada lo frena. **Sin alerta** (no existía regla `gd4` en el proyecto).
- Restauración: por **soft-delete**; 50/50 comprobantes recuperados, 0 perdidos.
- Resultados (`security-chaos/evidence/exp4/ronda-0/results.json`):

| Métrica | R0 | Umbral | Veredicto |
|---|---|---|---|
| RTO total | **34 m 35 s** (2075 s) | ≤ 30 min | **excede** |
| RTO parcial (10) | 32 m 42 s (1962 s) | — | — |
| RPO | **20 m 33 s** (1233 s) | ≤ 60 min | cumple |
| Objetos restaurados | 50/50 | — | sin pérdida |
| MTTD | no detectado | — | sin detección |

**Conclusión R0:** H4 refutada — se recupera todo, pero el RTO se pasa de los 30 min y no hay
detección. La R1 (con retención en el bucket de Daniela + la copia WORM + la regla
`gd4-mass-object-destruction`) debe mejorar RTO y detectar el ataque.

### Ronda 1 · [PENDIENTE]
Requiere las mejoras de R1: retención en el bucket de Daniela, la copia WORM activa (transferencia
pendiente del `[AVISO] lectura concedida` de Daniela) y la regla de detección de destrucción masiva.

**Tasa de falsos positivos:** medida con los `negative.sh` (tráfico normal del flujo) de cada regla;
en Exp. 3 ninguna regla disparó con tráfico normal (0 falsos positivos).

## 9. Tendencias del sector implementadas (2)
1. **Identidad de agentes de IA y privilegios de máquina no gestionados** (Phol): el asistente SOC
   corre con su propia cuenta de servicio `soc-assistant` de **mínimo privilegio** e **impersonación**
   (tokens efímeros, sin llaves). Fuente: Gartner, *Top Strategic Technology Trends for 2027*
   (20 oct 2026). [Confirmar URL y fecha de consulta en `tendencias.md`.]
2. **Honeytoken** (Neithan): [PENDIENTE — secreto señuelo con alerta al ser tocado, fuente y fecha.]

## 10. Lecciones aprendidas, riesgos residuales y próximos experimentos
- **Lecciones:** una métrica con ámbito de proyecto no cae con una exclusión (se calcula antes); hay
  que usar ámbito de bucket. Un modelo moderno resiste la inyección ingenua, pero la defensa no debe
  depender de eso. El contenedor de biblio corre como root (pendiente de endurecer).
- **Riesgos residuales:** egreso de biblio abierto a los pares por HTTP; SA desplegador con permisos
  amplios; en Exp. 3, la cobertura de R1 se logró por `tamper`; el latido confirma pero es más lento.
- **Próximos experimentos:** endurecer el contenedor (no-root, read-only FS), mTLS entre servicios,
  filtrado de egreso por FQDN, y forzar un asistente deliberadamente vulnerable para medir el delta
  de las mitigaciones v1.
