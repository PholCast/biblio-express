# Tabla de trazabilidad — control · experimento · marco de referencia

Cada control bajo prueba se relaciona con su experimento, la técnica emulada y su contramedida,
mapeados a ISO/IEC 27001:2022 Anexo A, NIST SP 800-53 r5 y NIST SP 800-207 (verificación continua,
mínimo privilegio, microsegmentación), más MITRE ATT&CK, ATLAS y D3FEND.

**Catálogos consultados el 2026-11-17:** ATT&CK Enterprise **v20.1** (versión vigente en
attack.mitre.org/resources/versions), ATLAS **v2026.10**, D3FEND **0.26.1**, OWASP Top 10 for
Agentic Applications 2026 (publicado el 2025-12-09). Los IDs de este documento se abrieron uno por
uno en el sitio oficial; ATT&CK v20 renombró T1562.008 y T1562.001 como T1685.002 y T1685.

## Técnicas ATT&CK / ATLAS verificadas
| ID | Nombre exacto | Exp. | URL |
|---|---|---|---|
| T1552.005 | Unsecured Credentials: Cloud Instance Metadata API | 1 | https://attack.mitre.org/techniques/T1552/005/ |
| T1078.004 | Valid Accounts: Cloud Accounts | 1 | https://attack.mitre.org/techniques/T1078/004/ |
| T1555.006 | Credentials from Password Stores: Cloud Secrets Management Stores | 1 | https://attack.mitre.org/techniques/T1555/006/ |
| T1580 | Cloud Infrastructure Discovery | 1 | https://attack.mitre.org/techniques/T1580/ |
| T1610 | Deploy Container | 2 | https://attack.mitre.org/techniques/T1610/ |
| T1046 | Network Service Discovery | 2 | https://attack.mitre.org/techniques/T1046/ |
| T1071.001 | Application Layer Protocol: Web Protocols | 2 | https://attack.mitre.org/techniques/T1071/001/ |
| T1685.002 | Disable or Modify Tools: Disable or Modify Cloud Log | 3 | https://attack.mitre.org/techniques/T1685/002/ |
| T1685 | Disable or Modify Tools | 3 | https://attack.mitre.org/techniques/T1685/ |
| AML.T0051.001 | LLM Prompt Injection: Indirect (ATLAS) | 3 | https://atlas.mitre.org/techniques/AML.T0051.001 |
| T1485 | Data Destruction | 4 | https://attack.mitre.org/techniques/T1485/ |

## Contramedidas D3FEND verificadas
| ID | Nombre | Exp. |
|---|---|---|
| D3-DUC | Decoy User Credential | 1 |
| D3-AZET | Authorization Event Thresholding | 1 |
| D3-CRO | Credential Rotation (parcial) | 1 |
| D3-UGLPA | User Geolocation Logon Pattern Analysis (**no implementada**) | 1 |
| D3-NI, D3-ITF, D3-OTF, D3-NTA | Network Isolation, Inbound Traffic Filtering, Outbound Traffic Filtering, Network Traffic Analysis | 2 |
| D3-PM | Platform Monitoring | 3 |
| D3-RF, D3-FIM | Restore File, File Integrity Monitoring | 4 |

**Limitación declarada:** la búsqueda inversa de D3FEND para T1610 y T1046 no devuelve D3-NI, D3-ITF
ni D3-OTF; se citan porque son las contramedidas de red que se implementaron y sus fichas existen.
Para T1685.002, D3-PM figura en la página de contramedidas, que es un listado amplio.

## Control · experimento · marco

| Exp. | Control | ATT&CK / ATLAS | D3FEND | ISO 27001:2022 A | NIST 800-53 r5 | NIST 800-207 | R0 | R1 |
|---|---|---|---|---|---|---|---|---|
| 1 (Neithan) | Rol `pokenetes-api-instance` y `GetSecretValue` solo vía VPC endpoint | T1552.005 (no detectada), T1078.004 (detectada) | D3-AZET | A.5.15, A.5.16, A.8.2 | AC-3, AC-6, IA-9 | Mínimo privilegio; verificación continua | Refutada. Secreto leído, sin alarma | Cumplida. Lectura denegada a los 17 s; alarma a los 155 s |
| 1 | Lectura de Secrets Manager | T1555.006 (detectada) | D3-AZET | A.5.17, A.8.5 | IA-5, AC-6 | Mínimo privilegio | `GetSecretValue` permitida | Denegada en la pasada medida |
| 1 | Enumeración iam, s3 y ec2 | T1580 (no detectada) | — | A.8.2 | AC-6 | Mínimo privilegio | Denegada | Denegada |
| 1 | Señuelo `backup-admin` | Apoya T1555.006 | D3-DUC | A.5.17 | SC-26 | — | No existía | Lo leyó la pasada previa; alarma a las 01:20:03Z |
| 2 (Daniela) | NetworkPolicy y denegación por defecto en `hospitaline-prod` | T1610, T1046, T1071.001 | D3-NI, D3-ITF, D3-OTF, D3-NTA | A.8.20–A.8.23 | AC-4, SC-7, SC-7(5), CM-7 | Microsegmentación | Refutada. Redis y salida abiertos; cobertura 0/3 | Confirmada. `gd2-netpol-deny` a los 22 s; cobertura 3/3 |
| 3 (Phol) | Logging, alertas y asistente SOC | T1685.002, T1685, AML.T0051.001 | D3-PM | A.8.15, A.8.16, A.8.17, A.5.25, A.5.28 | AU-6, AU-9, AU-12, SI-4 | Verificación continua | Refutada. Sin señal; cobertura 1/3 | Confirmada. `gd3-telemetry-tamper` a los 22 s; cobertura 3/3 |
| 4 (grupal) | Retención del bucket, auditoría `DATA_WRITE` y copia aislada WORM | T1485 | D3-RF, D3-FIM | A.8.13, A.5.29, A.5.30, A.8.10 | CP-9, CP-10, SI-7, SC-28 | Protección del recurso; mínimo privilegio | Refutada. RTO 2075 s (> 30 min); sin alerta | Confirmada. Principal RPO/RTO 0; alerta a los 444 s; copia RTO 1369 s |

**OWASP Top 10 for Agentic Applications 2026 (Exp. 3):** ASI01 Agent Goal Hijack, ASI02 Tool
Misuse, ASI03 Identity & Privilege Abuse.
