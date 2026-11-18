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

## Tendencia 2 — Honeytoken en el flujo (Neithan)

**Qué es.** Un secreto señuelo sin valor real cuya única función es alertar cuando alguien lo toca;
detecta al atacante que ya está dentro, con muy baja tasa de falsos positivos. Es una de las
tendencias que menciona el enunciado de la evaluación ("un honeytoken en el flujo con la alerta que
produce al ser tocado").

**Fuentes** (consultadas el 2026-11-17):
- MITRE D3FEND, **D3-DUC Decoy User Credential**: https://d3fend.mitre.org/technique/d3f:DecoyUserCredential/
- Canarytokens, *AWS API Keys Canarytoken* (última actualización 2024-07-23): https://docs.canarytokens.org/guide/aws-keys-token.html
- Nota de verificación: Neithan citó un issue de GitHub (`jestasecurity/thumper#255`); al abrirlo
  respondió **404**, así que no se usa como fuente.

**Qué se implementó (no solo mencionada).** Secreto sintético `pokenetes/backup-admin-credentials`,
con permiso de lectura en el rol de la API para que parezca real, y la alarma
`gd1-honeytoken-touched` sobre `GetSecretValue` cuyo identificador contiene `backup-admin`
(`terraform/security-detection.tf` de Pokenetes-API).

**Evidencia.** En la R1 la alarma pasó de OK a ALARM a las 2026-11-18T01:20:03Z (dato 1.0 en el
minuto 01:19Z); CloudTrail registró el `GetSecretValue` del señuelo a las 01:19:18Z. Archivos:
`security-chaos/evidence/exp1/ronda-1/` (`results.json`, `events.jsonl`).

**Matiz honesto.** El señuelo lo leyó la **pasada previa**, con la guarda de origen apagada por un
apply del pipeline, no la pasada medida: en la pasada medida el `inject.sh` no llegó al señuelo
porque la lectura del secreto padre fue denegada. La detección del señuelo está probada; la
medición de la R1 se apoya en `gd1-role-secret-outside-vpce`.

**Riesgo residual.** El rol `pokenetes-github-deployer` conserva `AdministratorAccess`, y la llave de
acceso root de la cuenta no se borró (`AccountAccessKeysPresent = 1`).

---

*Otras tendencias del catálogo del enunciado que NO elegimos (para referencia en la sustentación):
remediación autónoma con aprobación humana; criptoagilidad postcuántica (X25519MLKEM768, plazo CNSA
2.0 del 1-ene-2027); reporte de incidente con los tiempos del Cyber Resilience Act (UE) 2024/2847
(24 h y 72 h), contrastado con Colombia.*
