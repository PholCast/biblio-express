resource "google_monitoring_notification_channel" "email" {
  count = var.notification_email == "" ? 0 : 1

  project      = var.project_id
  display_name = "Biblio canary email"
  type         = "email"

  labels = {
    email_address = var.notification_email
  }
}

locals {
  canary_requests = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.canary_service}\""

  alert_documentation = <<-EOT
    Umbrales versionados en observability/canary-slo.json (max5xxRate = 0.01, maxP95LatencyMs = 500).
    Durante una promoción, el quality gate (scripts/run-canary-stages.sh) evalúa el mismo SLO y ejecuta
    el rollback automático a 100% stable / 0% canary. Fuera de una promoción, revisar el dashboard
    y forzar el rollback ejecutando gcp-canary.yml en modo manual, etapa 0.
  EOT
}

# Proporción de 5xx del canary > 1% (max5xxRate) sostenida 60 s.
resource "google_monitoring_alert_policy" "canary_5xx" {
  project      = var.project_id
  display_name = "${var.dashboard_name} canary 5xx > 1%"
  combiner     = "OR"

  conditions {
    display_name = "Canary 5xx ratio above SLO"

    condition_threshold {
      filter             = "${local.canary_requests} metric.labels.response_code_class=\"5xx\""
      denominator_filter = local.canary_requests
      comparison         = "COMPARISON_GT"
      threshold_value    = 0.01
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

  notification_channels = var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].name]
}

# Latencia p95 del canary > 500 ms (maxP95LatencyMs) sostenida 60 s.
resource "google_monitoring_alert_policy" "canary_latency" {
  project      = var.project_id
  display_name = "${var.dashboard_name} canary p95 > 500 ms"
  combiner     = "OR"

  conditions {
    display_name = "Canary p95 latency above SLO"

    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.canary_service}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 500
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

  notification_channels = var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].name]
}

resource "google_monitoring_dashboard" "this" {
  project = var.project_id
  dashboard_json = jsonencode({
    displayName = var.dashboard_name
    gridLayout = {
      columns = "3"
      widgets = [
        for panel in local.dashboard_panels : {
          title = panel.title
          xyChart = merge(
            {
              dataSets = [
                for service in [var.stable_service, var.canary_service] : {
                  legendTemplate = service
                  plotType       = "LINE"
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"${panel.metric}\" ${local.run_filter} resource.labels.service_name=\"${service}\"${panel.extra}"
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = panel.aligner
                        crossSeriesReducer = panel.reducer
                      }
                    }
                  }
                }
              ]
            },
            panel.threshold == null ? {} : {
              thresholds = [{ value = panel.threshold }]
            },
          )
        }
      ]
    }
  })
}
