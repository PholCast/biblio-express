# Matriz de cumplimiento — Evaluación Final de Caos de Seguridad

Relaciona cada requisito del enunciado con su responsable, su implementación y su evidencia.
**Estado:** ✅ cumplido y con evidencia · 🟡 cumplido con una salvedad · ⏳ pendiente.
Las rutas son de este repositorio salvo que se indique otro.

## Criterio 1 — Diseño del game day (20 %)
| ID | Requisito | Resp. | Implementación | Evidencia | Estado |
|---|---|---|---|---|---|
| 1.a | Game day en grupo sobre la arquitectura multinube; métrica = eficacia de los controles | Los tres | Cuatro experimentos sobre el flujo de tres nubes | `docs/gameday/informe-gameday.md` | ✅ |
| 1.b | Inventario de controles por capa, con propietario, señal y D3FEND | Los tres | Cinco capas, filas de cada integrante | `docs/gameday/inventario-controles.md` | ✅ |
| 1.c | Técnica emulada mapeada a ATT&CK; capa de IA a ATLAS | Cada uno | IDs abiertos uno por uno en los sitios oficiales (ATT&CK v20.1, ATLAS v2026.10) | `docs/gameday/trazabilidad.md` | 🟡 D3FEND de T1610/T1046 sin respaldo en la búsqueda inversa (declarado) |
| 1.d | Reglas de compromiso escritas y aceptadas antes de ejecutar | Los tres | Ventana, radio de impacto, recursos, datos sintéticos, parada, reversión, bitácora | `docs/gameday/reglas-de-compromiso.md` en los tres repos; commits a las 18:23Z (Phol), 18:40Z (Neithan) y 18:55Z (Daniela), todos antes de su R0 (19:00Z, 19:01Z y 19:13Z) | ✅ |
| 1.e | Una hipótesis falsable por experimento (S, T1, T2) | Cada uno | Texto "dado C, cuando A, esperamos S en ≤ T1 y contención en ≤ T2" | `docs/gameday/hipotesis.md`; `experiment.yaml` | ✅ |
| 1.f | Exp. 1: identidad de máquinas y agentes | Neithan | Credencial del rol usada desde otro origen | `evidence/exp1/` | ✅ |
| 1.g | Exp. 2: exposición y segmentación | Daniela | Pod no declarado hacia Redis y salida a Internet | `evidence/exp2/` | ✅ |
| 1.h | Exp. 3: telemetría degradada e inyección en un dato que ingiere la IA | Phol | Exclusión de logs, alerta apagada e inyección en el título de un libro | `security-chaos/evidence/exp3/` | ✅ |
| 1.i | Exp. 4 grupal: sobrescribir/borrar, RPO y RTO reales, restauración parcial | Los tres | Bucket de comprobantes, copia aislada y restauración de 10 y luego del total | `security-chaos/evidence/exp4/` | ✅ |
| 1.j | Estado estable medido antes: cobertura de telemetría, controles activos, línea base | Cada uno | `steady-state.sh` antes de la R0; la R0 es la línea base de MTTD/MTTC | `security-chaos/evidence/exp3/estado-estable.json`; `evidence/exp1/estado-estable.json` (Pokenetes-API); `evidence/exp2/estado-estable.json` (HospitalineD) | ✅ |
| 1.k | Experimentos como código, reproducibles, con parada y reversión verificada | Cada uno | Scripts `inject/rollback/stop/measure` | `security-chaos/README.md`; `exp1-identidad/` y `exp4-datos/` (Pokenetes-API); `exp2-segmentacion/` y `exp4-datos/` (HospitalineD), con `inject`, `rollback` y `measure`; la parada es `stop.sh` en los Exp. 1, 2 y 3, y en el Exp. 4 de Daniela va dentro de `inject.sh` (archivo `STOP` y objeto `_control/STOP`) | ✅ |
| 1.l | Trazabilidad a ISO 27001:2022 A, NIST 800-53 y NIST 800-207 | Phol consolida | Tabla control · experimento · marco | `docs/gameday/trazabilidad.md` y README | ✅ |
| 1.m | Diagrama por capas en el README con inyección, fronteras y telemetría | Phol | Diagrama SVG/PNG con E1–E4, tres fronteras y T1–T4 | `docs/diagramas/arquitectura-seguridad-gameday.png` y `README.md` | ✅ |

## Criterio 2 — Ejecución, detección como código e informe (20 %)
| ID | Requisito | Resp. | Implementación | Evidencia | Estado |
|---|---|---|---|---|---|
| 2.a | Dos rondas con el mismo método; tabla con MTTD, MTTC, cobertura, FP y RPO/RTO | Cada uno | Mismos scripts en R0 y R1 | Informe §4; `evidence/expN/ronda-R/results.json` | 🟡 FP del Exp. 1 declarado "no medido" |
| 2.b | Métrica objetivo de cada integrante declarada antes de la R0 | Cada uno | Declarada en `hipotesis.md` | Commit anterior a la R0 | ✅ |
| 2.c | Detección como código con caso positivo y negativo | Cada uno | Reglas en Terraform; tests por regla | Phol: `security-chaos/detections/tests/*/last-run.positive.log` y `last-run.negative.log` (negativos 3/3 PASS; positivos 2/3, latido no concluyente). Neithan: fixtures y `test-filter.sh`, sin salida versionada. Daniela: reglas en Terraform, sin pruebas positivo/negativo en el repo | 🟡 Parcial: Daniela sin tests, latido no demostrado |
| 2.d | Al menos dos mejoras por integrante, propias de su capa | Cada uno | Ver informe §6 (tres por integrante) | Terraform y manifiestos; resultados R1 | ✅ |
| 2.e | Exp. 4: inmutabilidad (WORM) más una copia aislada | Phol y Daniela | Retención en el bucket principal y copia con retención **bloqueada** | Borrado rechazado en ambos (R1) | ✅ |
| 2.f | IA aplicada a la defensa, con humano en el bucle y evaluación crítica | Phol y todos | Un triage único y su evaluación contra la telemetría | `docs/gameday/ia/` | ✅ |
| 2.g | Caos sobre la capa de IA; OWASP y ATLAS; mitigación; repetir la prueba | Phol | Inyección en el título; cuatro mitigaciones; prueba repetida en R1 | `evidence/exp3/ronda-*/ai-injection-results.json` | ✅ |
| 2.h | Al menos dos tendencias verificables, con fuente y fecha, implementadas | Phol y Neithan | Identidad de agentes de IA y honeytoken | `docs/gameday/tendencias.md` | 🟡 URL oficial de Gartner por confirmar |
| 2.i | Informe ≤ 10 páginas con todas las secciones; evidencia correlacionada por trace id | Phol y todos | Informe de ~4 páginas (estimado por palabras) | `docs/gameday/informe-gameday.md` | 🟡 Páginas estimadas, no medidas en PDF |
| 2.j | Entregable independiente del de DevOps | Phol | Informe y carpeta propios | `docs/gameday/` frente a `docs/informe-experimento.md` | ✅ |

## Criterio 3 — Sustentación individual (60 %)
| ID | Requisito | Resp. | Preparación | Estado |
|---|---|---|---|---|
| 3.a | Preguntas de las cinco unidades y de todo el game day | Los tres | Repaso conjunto de las capas y nubes de los compañeros | ⏳ |
| 3.b | Conceptos del ejercicio (SCE frente a pentest, estado estable, radio de impacto, MTTD/MTTC, cobertura frente a FP y tasa base, identidad de máquina frente a persona, riesgos de IA agéntica) | Los tres | Notas personales | ⏳ |
| 3.c | Explicar el mapeo a ATT&CK, D3FEND y ATLAS sin citar IDs inexistentes | Cada uno | `trazabilidad.md` con fecha de consulta | ✅ |
| 3.d | Demo en vivo: (a) estado estable y tablero, (b) experimento con parada, (c) alerta y cronología, (d) mejora funcionando, (e) reversión | Cada uno | Recorrido por integrante sobre la ventana ya medida | ⏳ |
| 3.e | Entrega del repositorio, experimentos e informe el 18 de noviembre antes de clase | Los tres | `v5.1.0`, push y release | ⏳ |
