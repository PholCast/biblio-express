# Security dashboard for Exp. 3 (plan P5). Shows the telemetry heartbeat and the health uptime,
# so the demo can point at the tablero required by the sustentación (3.d.a).
resource "google_monitoring_dashboard" "security" {
  project = var.project_id

  dashboard_json = jsonencode({
    displayName = "Biblio — seguridad (game day)"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          xPos = 0, yPos = 0, width = 6, height = 4
          widget = {
            title = "Latido de telemetría (logs del servicio en _Default)"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.telemetry_heartbeat.name}\" resource.type=\"logging_bucket\""
                    aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_COUNT" }
                  }
                }
              }]
            }
          }
        },
        {
          xPos = 6, yPos = 0, width = 6, height = 4
          widget = {
            title = "Disponibilidad de /health (uptime)"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\""
                    aggregation = { alignmentPeriod = "300s", perSeriesAligner = "ALIGN_FRACTION_TRUE" }
                  }
                }
              }]
            }
          }
        },
        {
          xPos = 0, yPos = 4, width = 12, height = 4
          widget = {
            title = "Eventos del asistente SOC (gd-ai-assistant)"
            logsPanel = {
              filter        = "logName=\"projects/${var.project_id}/logs/gd-ai-assistant\""
              resourceNames = ["projects/${var.project_id}"]
            }
          }
        },
      ]
    }
  })

  # GCP re-serializes the dashboard JSON in a different field order, which Terraform would
  # otherwise report as a perpetual diff. We own the content, so ignore the server's reordering.
  lifecycle {
    ignore_changes = [dashboard_json]
  }
}

output "security_dashboard" {
  value = "https://console.cloud.google.com/monitoring/dashboards/builder/${basename(google_monitoring_dashboard.security.id)}?project=${var.project_id}"
}
