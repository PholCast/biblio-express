# Tendencias del sector implementadas

El enunciado exige **al menos dos tendencias verificables, con la fuente citada y la fecha de
consulta, implementadas o instrumentadas (no solo mencionadas)**. El grupo implementó dos.

## Tendencia 1 — Identidad de agentes de IA y privilegios de máquina no gestionados (Phol)

**Qué es.** El auge de agentes de IA crea identidades de máquina con privilegios que a menudo no se
gestionan (sin dueño, sin rotación, con permisos de persona). Gartner lo señala como riesgo
emergente y predice que **para 2028 el 25 % de las brechas empresariales se originará en el abuso de
agentes de IA**.

**Fuente.** Gartner, *Top Strategic Technology Trends for 2027*, 20 de octubre de 2026.
Fecha de consulta: 2026-11-17. *(URL oficial de Gartner por confirmar; la predicción y la fecha son
las que cita el enunciado de la evaluación.)*

**Cómo se implementó (no solo mencionada).** El asistente SOC del Exp. 3 **no corre como una
persona ni con una llave estática**: tiene su propia cuenta de servicio de **mínimo privilegio**
`soc-assistant@biblio-express-final-2026.iam.gserviceaccount.com`, con solo lectura de telemetría
(`logging.viewer`, `monitoring.viewer`), escritura de sus propios eventos (`logging.logWriter`) y uso
de Vertex AI (`aiplatform.user`), **sin ningún permiso de edición**. Phol la usa por
**impersonación** (`roles/iam.serviceAccountTokenCreator`), con **tokens efímeros y sin llaves**.

**Evidencia.**
- IaC: `security-chaos/terraform/iam.tf`.
- Inventario de identidades de máquina: `docs/gameday/inventario-identidades-maquina.md` (muestra
  que `soc-assistant` no tiene llaves y es de mínimo privilegio, frente al deployer sobreprivilegiado).
- En el Exp. 3, las acciones con efecto propuestas a la IA requieren **aprobación humana** y se
  ejecutarían con la identidad del humano, no la del agente (mitigación probada).

## Tendencia 2 — Honeytoken en el flujo (Neithan) · [PENDIENTE]

**Qué es.** Un secreto señuelo sin valor real cuya única función es alertar cuando alguien lo toca;
detecta al atacante que ya está dentro, con muy baja tasa de falsos positivos.

[PENDIENTE — Neithan: secreto señuelo `pokenetes/backup-admin-credentials`, la alarma
`gd1-honeytoken-touched` que dispara al leerlo, la fuente del sector con URL y fecha de consulta, y
la evidencia de la alarma disparando en la R1.]

---

*Otras tendencias del catálogo del enunciado que NO elegimos (para referencia en la sustentación):
remediación autónoma con aprobación humana; criptoagilidad postcuántica (X25519MLKEM768, plazo CNSA
2.0 del 1-ene-2027); reporte de incidente con los tiempos del Cyber Resilience Act (UE) 2024/2847
(24 h y 72 h), contrastado con Colombia.*
