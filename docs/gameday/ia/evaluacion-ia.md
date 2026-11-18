# Evaluación crítica del aporte de la IA

Cada afirmación del triage (`triage-gameday.md`) se contrastó contra la **telemetría real**: los
`results.json`, `events.jsonl` y bitácoras de `security-chaos/evidence/`. Veredictos: **acertó**,
**inexacto** (parcialmente correcto), **inventó** (sin respaldo en la telemetría) o **se descartó**
(correcto pero innecesario o ya hecho).

**Responsable de revisar cada fila:** Exp. 1 → Neithan · Exp. 2 y Exp. 4 → Daniela · Exp. 3 → Phol.

| # | Afirmación de la IA | Veredicto | Contraste con la telemetría real | Revisa |
|---|---|---|---|---|
| 1 | Cuatro grupos de alertas con sus políticas (`gd1-*`, `gd2-netpol-deny`, `gd3-*`, `gd4-*`) | **Acertó** | Coincide con `alerts_fired` de las R1: Exp. 1 (`outside-vpce`, `honeytoken`), Exp. 2 (`netpol-deny`), Exp. 3 (`tamper`, `ai-agent-guard`), Exp. 4 (`mass-object-destruction`). | Todos |
| 2 | Agrupa el Exp. 3 como "Seguridad de IA" | **Inexacto** | El Exp. 3 es principalmente **ceguera de telemetría** (exclusión de logs + alerta apagada); la capa de IA es la fase B. La alerta principal (`tamper`) es de telemetría. | Phol |
| 3 | Causa: "ejecución programada de experimentos de game day" | **Acertó (genérico)** | Es correcto y no hubo incidente real, pero no aporta nada que no se supiera: no distingue qué control reaccionó en cada experimento. Además no fue "programada": cada ronda la lanzó un operador. | Todos |
| 4 | Cronología: Exp. 3 inicia 20:51Z con detección de manipulación e intentos de inyección | **Acertó** | R1 de Exp. 3: t0 20:51:57Z, `tamper` a las 20:52:19Z (MTTD 22 s); la fase B reportó 3 de 3 payloads. | Phol |
| 5 | Cronología: Exp. 2 inicia 01:16Z con el pod `gd-intruder` y alertas por denegación | **Acertó** | `pods.create` a las 01:16:56Z; t0 01:17:08Z; `gd2-netpol-deny` a las 01:17:30Z (MTTD 22 s). | Daniela |
| 6 | Cronología: Exp. 1 "inicia 01:20Z" con alarmas del honeytoken y del uso fuera del VPC endpoint | **Inexacto** | Hay **dos pasadas**. La pasada previa fue a las 01:18:35Z y disparó el honeytoken a las 01:20:03Z (porque `enable_origin_guard` estaba en `false`). La pasada **medida** empezó a las 01:21:54Z y `outside-vpce` salta a las 01:24:29Z (MTTD 155 s). La IA fundió las dos pasadas y no vio la anomalía de la guarda apagada. | Neithan |
| 7 | Cronología: Exp. 4 inicia 02:22Z con "simulación de borrado masivo" | **Inexacto** | La hora es correcta (t0 02:22:22Z), pero **no fue una simulación**: fueron 25 sobrescrituras y 25 borrados reales, **denegados por la retención** del bucket. | Daniela |
| 8 | "Ejecución de drill de restauración (50 objetos verificados)" | **Inexacto** | Los 50 son los hashes del **bucket principal**, que no cambiaron (RPO/RTO = 0). El drill desde la **copia aislada** restauró **40** (10 parciales a las 02:43:41Z, 40 a las 02:45:11Z); los otros 10 no están en la copia a propósito. | Daniela |
| 9 | Omite la ronda 0 de los cuatro experimentos | **Inexacto (omisión grave)** | Los eventos incluyen las R0: **ninguna** generó alerta (MTTD indefinido en Exp. 1, 2, 3 y 4). Es el hallazgo central del game day y la IA no lo menciona; solo narra las R1. | Todos |
| 10 | Prioridad "Media" | **Se descartó** | Todo corresponde a ejercicios autorizados, con datos sintéticos, en recursos del grupo. No hay incidente real; la prioridad correcta es **informativa/baja**. La IA no considera el contexto de autorización. | Todos |
| 11 | `injection_suspected = false` | **Acertó** | Los eventos analizados no traen texto de instrucciones (solo nombres de payload y resultados), así que no había una inyección *dentro* del dato. Las inyecciones del Exp. 3 se reportan como eventos, no como instrucciones ocultas. | Phol |
| 12 | Acción: pedir aprobación para verificar que la alerta 5xx esté habilitada | **Se descartó** | Es prudente y respeta el modelo de aprobación (no la ejecutó), pero ya estaba verificado: la política `16462647778850420950` está `enabled=True` (revisada tras el Exp. 3 y en la puerta de R1). | Phol |
| 13 | Acción: validar la integridad de los 50 comprobantes restaurados | **Se descartó** | Ya está hecho: `objects_lost = 0` y los 50 hashes coinciden con la línea base (`results.json` del Exp. 4 R1). | Daniela |
| 14 | Acción: documentar las técnicas detectadas (T1685, AML.T0051.001) | **Inexacto** | Hay más técnicas detectadas en otros experimentos (T1078.004, T1555.006 en Exp. 1; T1610, T1046, T1071.001 en Exp. 2; T1485 en Exp. 4) y en el Exp. 3 el ID completo es **T1685.002**. | Todos |
| 15 | "Mejorar los modelos de detección de la IA" | **Inventó** | No existen modelos de detección basados en IA: la detección son **reglas** de Cloud Monitoring/CloudWatch. La IA solo correlaciona y resume. | Phol |
| 16 | No menciona qué **no** se detectó | **Inexacto (omisión)** | En la R1 no se detectaron T1552.005 y T1580 (Exp. 1, cobertura 2/4) y no disparó `gd3-telemetry-heartbeat-absent` (la ventana fue menor que los 5 min de ausencia). Son riesgos residuales que el triage no señala. | Neithan, Phol |

## Resumen
- De 16 afirmaciones: **acertó 5** (filas 1, 3, 4, 5, 11; la 3 solo en términos genéricos),
  **inexacto o con omisión 7** (2, 6, 7, 8, 9, 14, 16), **se descartó 3** (10, 12, 13) e **inventó 1** (15).
- **Qué aportó la IA:** agrupar las alertas por experimento y ordenar la cronología de las R1 en
  segundos; es útil como primer borrador para quien no conoce los experimentos.
- **Dónde falló:** fundió pasadas (Exp. 1), confundió el drill de la copia con la verificación del
  bucket (Exp. 4), llamó "simulación" a un ataque real bloqueado, sobreestimó la prioridad, inventó
  "modelos de detección de IA" y **no vio que las R0 no detectaron nada**, que es la conclusión más
  importante.
- **Por qué el humano en el bucle importa:** cada error se descubrió solo al **contrastar con los
  `results.json` y las bitácoras**. Si el triage se hubiera tomado como verdad, el informe habría
  contado una historia más favorable que la real.

## Precisiones sobre el propio asistente
- **Marcas de tiempo del Exp. 3:** los eventos del asistente (fase B) llevan la hora de cierre de la
  ronda, no la hora exacta de cada intento, porque esa hora no se registró.
- **Identidad:** las herramientas que usan `gcloud` pueden correr como `soc-assistant`
  (`AI_IMPERSONATE`), pero la **llamada al modelo** usa las credenciales del operador. En esta
  corrida el asistente solo leyó un archivo local, así que la identidad propia no se ejercitó. Queda
  como riesgo residual para un siguiente experimento.
