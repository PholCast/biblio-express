resource "google_monitoring_notification_channel" "email" {
  count = var.notification_email == "" ? 0 : 1

  project      = var.project_id
  display_name = "Biblio chaos email"
  type         = "email"

  labels = {
    email_address = var.notification_email
  }
}

locals {
  run_service  = "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.service_name}\""
  run_requests = "metric.type=\"run.googleapis.com/request_count\" ${local.run_service}"
  channels     = var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].name]

  alert_documentation = <<-EOT
    Umbrales del estado estable de biblio-express. Durante un experimento de caos
    (panel "Ventana de inyección" del dashboard) la alerta es esperada en Ronda 0.
    Fuera de un experimento, revisar el pool de conexiones y apagar cualquier fallo
    activo con DELETE /chaos/pool-exhaustion.
  EOT
}

# Proporción de 5xx por encima del estado estable, sostenida 60 s.
resource "google_monitoring_alert_policy" "errors_5xx" {
  project      = var.project_id
  display_name = "${var.dashboard_name} 5xx above steady state"
  combiner     = "OR"

  conditions {
    display_name = "5xx ratio above steady state"

    condition_threshold {
      filter             = "${local.run_requests} metric.labels.response_code_class=\"5xx\""
      denominator_filter = local.run_requests
      comparison         = "COMPARISON_GT"
      threshold_value    = var.max_5xx_rate
      duration           = "60s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }

      denominator_aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = local.alert_documentation
    mime_type = "text/markdown"
  }

  notification_channels = local.channels
}

# Latencia p95 por encima del estado estable, sostenida 60 s.
resource "google_monitoring_alert_policy" "latency_p95" {
  project      = var.project_id
  display_name = "${var.dashboard_name} p95 above steady state"
  combiner     = "OR"

  conditions {
    display_name = "p95 latency above steady state"

    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" ${local.run_service}"
      comparison      = "COMPARISON_GT"
      threshold_value = var.p95_threshold_ms
      duration        = "60s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MAX"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = local.alert_documentation
    mime_type = "text/markdown"
  }

  notification_channels = local.channels
}
