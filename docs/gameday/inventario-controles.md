# Inventario de controles por capa

Control, nube, propietario, señal que debería producir y contramedida D3FEND. Las filas de
biblio-express (Phol) están completas; Neithan y Daniela envían las suyas para consolidar.

## Capa de identidad
| Control | Nube / recurso | Propietario | Señal esperada | D3FEND |
|---|---|---|---|---|
| Runtime SA de Cloud Run con `cloudsql.client` + `secretAccessor` | GCP biblio | Phol | Acceso a secreto por SA fuera de patrón | D3-PM |
| Deployer por WIF/OIDC (sin llaves estáticas) | GCP biblio | Phol | Impersonación o uso del provider WIF | D3-PM |
| SA propio del asistente SOC con mínimo privilegio (mejora R1) | GCP biblio | Phol | Uso del SA fuera de lectura | D3-PM |
| Rol de instancia `pokenetes-api-instance` | AWS | Neithan | [PENDIENTE: Neithan] | [PENDIENTE] |
| Workload Identity KSA→GSA | GKE | Daniela | [PENDIENTE: Daniela] | [PENDIENTE] |

## Capa de red
| Control | Nube / recurso | Propietario | Señal esperada | D3FEND |
|---|---|---|---|---|
| Ingreso Cloud Run público (sin WAF hoy) | GCP biblio | Phol | Pico de tráfico anómalo | D3-ITF |
| Egreso del flujo a pares por HTTP | GCP biblio | Phol | Salida no esperada | D3-OTF |
| Security groups ALB/API/DB, egress | AWS | Neithan | [PENDIENTE: Neithan] | [PENDIENTE] |
| NetworkPolicies (mejora Exp. 2) | GKE | Daniela | [PENDIENTE: Daniela] | [PENDIENTE] |

## Capa de carga de trabajo
| Control | Nube / recurso | Propietario | Señal esperada | D3FEND |
|---|---|---|---|---|
| Imagen por digest, revisión única de Cloud Run | GCP biblio | Phol | Despliegue de digest no aprobado | D3-PM |
| Contenedor corre como root (riesgo residual) | GCP biblio | Phol | — (pendiente de endurecer) | — |
| EC2 Docker, imagen por digest | AWS | Neithan | [PENDIENTE: Neithan] | [PENDIENTE] |
| Probes, requests/limits, PDB, HPA | GKE | Daniela | [PENDIENTE: Daniela] | [PENDIENTE] |

## Capa de datos
| Control | Nube / recurso | Propietario | Señal esperada | D3FEND |
|---|---|---|---|---|
| Cloud SQL con backups y PITR | GCP biblio | Phol | Borrado o cambio de instancia | D3-PM |
| Copia aislada WORM del flujo (mejora Exp. 4) | GCP biblio | Phol | Intento de borrado en la copia | D3-RF |
| Bucket de comprobantes del flujo | GKE / GCS | Daniela | [PENDIENTE: Daniela] | [PENDIENTE] |

## Capa de detección y respuesta
| Control | Nube / recurso | Propietario | Señal esperada | D3FEND |
|---|---|---|---|---|
| Logging de Cloud Run al sink `_Default` | GCP biblio | Phol | Ausencia de logs del servicio | D3-PM |
| Alertas 5xx y p95 con canal de email | GCP biblio | Phol | 5xx o p95 sobre el estado estable | D3-PM |
| Alerta por ausencia de latido (mejora Exp. 3) | GCP biblio | Phol | Telemetría que deja de llegar | D3-PM |
| Bitácora inmutable `gd-audit` 30 días (mejora Exp. 3) | GCP biblio | Phol | Manipulación de sinks/alertas | D3-PM |
| CloudTrail + alarmas (Exp. 1) | AWS | Neithan | [PENDIENTE: Neithan] | [PENDIENTE] |
| Cloud Logging + alertas de red (Exp. 2) | GKE | Daniela | [PENDIENTE: Daniela] | [PENDIENTE] |
