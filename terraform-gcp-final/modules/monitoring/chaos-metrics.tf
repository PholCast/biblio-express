# Métricas basadas en los logs JSON que la API escribe en stdout
# (src/observability/app-logger.js). Permiten ver en Cloud Monitoring la
# ventana de inyección y la actuación de los patrones de resiliencia.
locals {
  app_logs = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.service_name}\""

  chaos_metrics = {
    fault_active = {
      name        = "biblio_chaos_fault_active"
      description = "Ventana de inyección: eventos del fallo activo (inicio y latido cada 10 s)."
      filter      = "${local.app_logs} AND jsonPayload.event=(\"chaos_fault_started\" OR \"chaos_fault_active\")"
    }
    degraded_responses = {
      name        = "biblio_degraded_responses"
      description = "Respuestas degradadas servidas desde la caché de respaldo (stale-if-error)."
      filter      = "${local.app_logs} AND jsonPayload.event=\"degraded_response\""
    }
    db_unavailable = {
      name        = "biblio_db_unavailable"
      description = "Peticiones rechazadas con 503 porque el pool no entregó conexión y no había copia."
      filter      = "${local.app_logs} AND jsonPayload.event=\"db_unavailable\""
    }
  }
}

resource "google_logging_metric" "chaos" {
  for_each = local.chaos_metrics

  project     = var.project_id
  name        = each.value.name
  description = each.value.description
  filter      = each.value.filter

  metric_descriptor {
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
    display_name = each.value.name
  }
}
