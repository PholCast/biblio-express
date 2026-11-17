# Tabla de trazabilidad — control · experimento · marco de referencia

Relaciona cada control bajo prueba con su experimento, la técnica adversaria emulada y las
contramedidas, mapeadas a los marcos exigidos. **Los IDs se verifican en el sitio oficial antes de
escribirlos** (citar una técnica inexistente se penaliza). Las filas del Exp. 3 están verificadas;
Neithan y Daniela completan y verifican las suyas.

**Marcos:** MITRE ATT&CK (Enterprise v20) · MITRE ATLAS (v2026.10) · MITRE D3FEND (0.26.1) ·
ISO/IEC 27001:2022 Anexo A · NIST SP 800-53 r5 · NIST SP 800-207 (Zero Trust: verificación continua,
mínimo privilegio, microsegmentación).

## Experimento 3 — Telemetría y capa de IA (Phol) · verificado 2026-11-17

| Elemento | Valor | Fuente / fecha de consulta |
|---|---|---|
| Control | Logging de Cloud Run + alertas de Monitoring + asistente SOC | — |
| Técnica (telemetría) | **T1685.002** Disable or Modify Tools: Disable or Modify Cloud Log (antes T1562.008) | attack.mitre.org · 2026-11-17 |
| Técnica (telemetría) | **T1685** Disable or Modify Tools (antes T1562.001) | attack.mitre.org · 2026-11-17 |
| Técnica (capa de IA) | **AML.T0051.001** LLM Prompt Injection: Indirect | atlas.mitre.org · 2026-11-17 |
| Contramedida | **D3-PM** Platform Monitoring | d3fend.mitre.org · 2026-11-17 |
| OWASP Agentic 2026 | ASI01 Agent Goal Hijack, ASI02 Tool Misuse, ASI03 Identity & Privilege Abuse | genai.owasp.org · 2026-11-17 |
| ISO 27001:2022 A | A.8.15 Registro, A.8.16 Monitoreo, A.8.17 Sincronización de relojes, A.5.25, A.5.28 | — |
| NIST 800-53 r5 | AU-6, AU-9 (protección de logs), AU-12, SI-4 (monitoreo del sistema) | — |
| NIST 800-207 | Verificación continua (la telemetría sostiene la confianza evaluada) | — |
| Reversión | `rollback.sh`: quita la exclusión, rehabilita la alerta, verifica log nuevo | evidence/exp3 |

## Experimento 1 — Identidad de máquina (Neithan) · [PENDIENTE]
| Control | Rol IAM `pokenetes-api-instance` (AWS) | — |
| Técnica | [Neithan verifica en ATT&CK v20: credencial de máquina desde otro origen / enumeración] | attack.mitre.org |
| Contramedida | [D3FEND: p. ej. Credential Rotation, Authorization Event Thresholding — verificar] | d3fend.mitre.org |
| ISO / 800-53 / 800-207 | A.5.15–18, A.8.2/5 · AC-2/3/6, IA-5/9 · Mínimo privilegio | — |

## Experimento 2 — Exposición y segmentación (Daniela) · [PENDIENTE]
| Control | Segmentación de red del namespace `hospitaline-prod` (GKE) | — |
| Técnica | [Daniela verifica en ATT&CK v20: despliegue de carga / descubrimiento de red / salida] | attack.mitre.org |
| Contramedida | [D3FEND: Network Isolation, Outbound Traffic Filtering — verificar] | d3fend.mitre.org |
| ISO / 800-53 / 800-207 | A.8.20–23 · AC-4, SC-7, CM-7 · Microsegmentación | — |

## Experimento 4 — Resiliencia de los datos (grupal) · [PENDIENTE]
| Control | Bucket de comprobantes del flujo + copia aislada WORM | — |
| Técnica | **T1485** Data Destruction [verificar nombre/ID en v20] | attack.mitre.org |
| Contramedida | **D3-RF** Restore File, **D3-FIM** File Integrity Monitoring [verificar] | d3fend.mitre.org |
| ISO / 800-53 / 800-207 | A.8.13, A.5.29/30, A.8.10 · CP-9/10, SI-7, SC-28 · Protección del recurso | — |
