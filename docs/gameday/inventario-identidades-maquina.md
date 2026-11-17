# Inventario de identidades de máquina — biblio-express (GCP)

Evidencia de la tendencia "identidad de agentes de IA y privilegios de máquina no gestionados".
Generado el 2026-11-17 con `gcloud iam service-accounts list` y `... keys list --managed-by=user`.

| Cuenta de servicio | Llaves de usuario | Privilegio | Observación |
|---|---|---|---|
| `soc-assistant@…` | **0** | Mínimo: `logging.viewer`, `monitoring.viewer`, `logging.logWriter`, `aiplatform.user` | **Agente de IA bien gestionado:** sin llaves, solo lectura, usado por impersonación (tokens efímeros). |
| `biblio-express-final-runtime@…` | 0 | `cloudsql.client`, `secretmanager.secretAccessor` | Runtime de Cloud Run, acotado. |
| `biblio-express-final-deployer@…` | 0 | **Amplio**: `run.admin`, `cloudsql.admin`, `iam.serviceAccountAdmin`, `secretmanager.admin`, `resourcemanager.projectIamAdmin`, entre otros | **Sobreprivilegiado** (riesgo residual). Mitiga: no tiene llaves, se usa por WIF/OIDC desde CI en `main`. |
| `grafana-cloud-reader@…` | **1** | Lectura de métricas | **Hallazgo:** tiene una llave estática gestionada por usuario (candidata a rotar a WIF). |
| `997240799960-compute@…` | 0 | Default de Compute | No usada por el flujo. |

## Lectura
- La identidad del **agente de IA** (`soc-assistant`) es la más sana del proyecto: cero llaves,
  mínimo privilegio, tokens efímeros. Es exactamente lo que la tendencia recomienda frente a los
  privilegios de máquina no gestionados.
- Riesgos residuales de identidad de máquina: el **deployer** es muy amplio (reducible con roles por
  recurso) y `grafana-cloud-reader` conserva **una llave estática** (migrable a WIF). Ambos quedan
  como próximos trabajos.
