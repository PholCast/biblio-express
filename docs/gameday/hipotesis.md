# Hipótesis de control y métricas objetivo

Declaradas **antes de ejecutar la ronda 0** (17 de noviembre de 2026). Una hipótesis falsable por
experimento, con la señal esperada (S), el tiempo hasta la detección (T1) y hasta la contención
(T2). La métrica objetivo de cada integrante se fija aquí y no se cambia entre rondas.

| Exp. | Integrante | Métrica objetivo | T1 (detección) | T2 (contención) |
|---|---|---|---|---|
| 1 | Neithan | MTTC | ≤ 15 min | ≤ 20 min |
| 2 | Daniela | Cobertura de detección | ≤ 5 min | ≤ 10 min |
| 3 | Phol | MTTD | ≤ 10 min | ≤ 15 min |
| 4 | Grupal | RTO (y RPO) | ≤ 10 min | RTO ≤ 30 min, RPO ≤ 60 min |

## H1 — Exp. 1, identidad de máquina (Neithan)
Dado el control *rol IAM `pokenetes-api-instance` con sus políticas tal como están hoy*, cuando
*sus credenciales temporales se usen desde un origen fuera de AWS y con un alcance no previsto
(lectura del secreto y enumeración)*, esperamos la señal *alarma de uso anómalo de la identidad
en CloudWatch* en ≤ 15 min, y la contención *(la credencial deja de servir desde ese origen)* en
≤ 20 min.

## H2 — Exp. 2, exposición y segmentación (Daniela)
Dado el control *segmentación de red del namespace `hospitaline-prod` tal como está hoy*, cuando
*un pod no declarado abra una conexión este-oeste a Redis:6379 y salga a Internet*, esperamos la
señal *alerta de conexión denegada / carga no declarada en Cloud Monitoring* en ≤ 5 min, y la
contención *(ruta cortada y pod eliminado)* en ≤ 10 min.

## H3 — Exp. 3, telemetría y capa de IA (Phol)
Dado el control *telemetría de biblio-express (logging de Cloud Run y alertas de Cloud Monitoring)
y el asistente SOC tal como están hoy*, cuando *se excluyan los logs del servicio del sink, se
desactive una alerta y un dato del flujo traiga instrucciones inyectadas para el asistente*,
esperamos la señal *alerta de manipulación o ausencia de telemetría en Cloud Monitoring* en
≤ 10 min, y la contención *(telemetría restablecida y ninguna acción con efecto ejecutada por la
IA sin aprobación humana)* en ≤ 15 min.

## H4 — Exp. 4, resiliencia de los datos (grupal)
Dado el control *bucket de comprobantes del flujo tal como está configurado hoy*, cuando *la
identidad de la carga sobrescriba y borre los objetos*, esperamos la señal *alerta de destrucción
masiva en Cloud Monitoring* en ≤ 10 min, y la contención *(objetos restaurados y verificados)* con
RTO ≤ 30 min y RPO ≤ 60 min.
