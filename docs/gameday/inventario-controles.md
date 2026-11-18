# Inventario de controles por capa

Control, nube, propietario, señal que produce y contramedida D3FEND (fichas verificadas el
2026-11-17). Estado **tras las mejoras de la ronda 1**. Cada integrante aportó sus filas:
Phol (biblio-express, GCP), Neithan (Pokenetes-API, AWS), Daniela (HospitalineD, GKE).

## Capa de identidad
| Control | Nube / recurso | Dueño | Señal | D3FEND |
|---|---|---|---|---|
| Runtime SA de Cloud Run con `cloudsql.client` y `secretAccessor` | GCP biblio | Phol | Acceso a secreto por SA fuera de patrón | D3-PM |
| Deployer por WIF/OIDC, sin llaves estáticas (riesgo residual: roles amplios) | GCP biblio | Phol | Uso del provider WIF | D3-PM |
| SA propio `soc-assistant`: solo lectura de telemetría, impersonación sin llaves | GCP biblio | Phol | Uso del SA fuera de lectura | D3-PM |
| Rol `pokenetes-api-instance`: `GetSecretValue` solo si `aws:SourceVpce` es `vpce-03c96dbd9816f6a62`; Deny si falta o es otro | AWS | Neithan | `AccessDenied` desde fuera; alarma `gd1-role-secret-outside-vpce` | D3-AZET |
| Rol `pokenetes-github-deployer` por OIDC, solo `main` y `dev` del repo `Enedev/Pokenetes-API`; llaves estáticas de Actions borradas | AWS | Neithan | `AssumeRoleWithWebIdentity` | D3-CRO |
| Workload Identity KSA→GSA de los pods | GKE | Daniela | — | — |

## Capa de red
| Control | Nube / recurso | Dueño | Señal | D3FEND |
|---|---|---|---|---|
| Ingreso público a Cloud Run, sin WAF (riesgo residual) | GCP biblio | Phol | Pico de tráfico anómalo | D3-ITF |
| Egreso del flujo hacia los pares por HTTP (riesgo residual) | GCP biblio | Phol | — | D3-OTF |
| Endpoint de interfaz de Secrets Manager, DNS privado, 443 solo desde el SG de la API | AWS | Neithan | Lecturas de la app salen por el endpoint | — |
| NetworkPolicy `hospitaline-api`, `hospitaline-redis` y `default-deny` | GKE | Daniela | `gd2-netpol-deny`: log `policy-action` con `disposition=deny` | D3-NI, D3-ITF, D3-OTF |
| `NetworkLogging` `default` con `cluster.deny.log: true` | GKE | Daniela | Logs `policy-action` del clúster | D3-NTA |
| Alerta `gd2-undeclared-workload` | GKE | Daniela | Audit `pods.create` en `hospitaline-prod` con principal que no empieza por `system:` | — |

## Capa de carga de trabajo
| Control | Nube / recurso | Dueño | Señal | D3FEND |
|---|---|---|---|---|
| Imagen de Cloud Run fijada por digest | GCP biblio | Phol | Despliegue de otro digest | D3-PM |
| El contenedor corre como root (riesgo residual, sin experimento) | GCP biblio | Phol | — | — |
| Imagen fijada por digest, `HEALTHCHECK` y health del ALB; sin `USER` en el Dockerfile: corre como root (riesgo residual) | AWS EC2 | Neithan | Target healthy y `/health` 200 | — |
| Sondas `liveness` y `readiness` en `GET /health:3000`; requests 250m/512Mi y limits 500m/1Gi | GKE | Daniela | `/health` 200 | — |
| `cloud-sql-proxy` con `runAsNonRoot: true`; la API usa el tag `v5.1.0` (no digest) y no declara `runAsNonRoot` (riesgo residual) | GKE | Daniela | — | — |

## Capa de datos
| Control | Nube / recurso | Dueño | Señal | D3FEND |
|---|---|---|---|---|
| Cloud SQL con backups y PITR | GCP biblio | Phol | Cambio o borrado de la instancia | D3-PM |
| Copia aislada WORM `biblio-express-final-2026-gd4-copia-aislada`, retención de 7 días **bloqueada** | GCP biblio | Phol | Borrado rechazado por retención | D3-RF |
| Secreto de la app `pokenetes/terraform` | AWS Secrets Manager | Neithan | `GetSecretValue` trae `vpcEndpointId` en CloudTrail | D3-AZET |
| Señuelo `pokenetes/backup-admin-credentials` (datos sintéticos) | AWS Secrets Manager | Neithan | Alarma `gd1-honeytoken-touched` | D3-DUC |
| Retención de 86400 s, sin bloqueo, en `gd4-flow-receipts` | GCS | Daniela | Borrado y sobrescritura de `receipts/` responden 403 | — |
| Auditoría `storage.googleapis.com` solo `DATA_WRITE` y métrica de borrados | GCS | Daniela | `gd4-mass-object-destruction`: 5 o más `storage.objects.delete` bajo `receipts/` en 60 s | D3-FIM |
| Copia aislada: Daniela la lee y restaura | GCS | Daniela | Objetos `gd4-r1-*` presentes en la copia | D3-RF |

## Capa de detección y respuesta
| Control | Nube / recurso | Dueño | Señal | D3FEND |
|---|---|---|---|---|
| Logging de Cloud Run al sink `_Default` | GCP biblio | Phol | Ausencia de logs del servicio | D3-PM |
| Alertas 5xx y p95 (fiabilidad) con canal de correo | GCP biblio | Phol | 5xx o p95 sobre el estado estable | D3-PM |
| `gd3-telemetry-tamper`, `gd3-telemetry-heartbeat-absent`, `gd3-ai-agent-guard` (Pub/Sub y correo) | GCP biblio | Phol | Cambio de sinks o alertas; logs ausentes; el asistente reporta una inyección | D3-PM |
| Bitácora inmutable `gd-audit`, retención de 30 días **bloqueada** | GCP biblio | Phol | Los logs siguen llegando aunque se excluyan de `_Default` | D3-PM |
| Trail `pokenetes-gameday` hacia `/pokenetes/cloudtrail` (30 días) y SNS `pokenetes-security` | AWS | Neithan | Las dos alarmas `gd1` y el correo | D3-AZET |
