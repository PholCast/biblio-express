resource "google_monitoring_notification_channel" "email" {
  count = var.notification_email == "" ? 0 : 1

  project      = var.project_id
  display_name = "Biblio canary email"
  type         = "email"

  labels = {
    email_address = var.notification_email
  }
}

resource "google_monitoring_alert_policy" "canary_5xx" {
  project      = var.project_id
  display_name = "${var.dashboard_name} canary 5xx"
  combiner     = "OR"

  conditions {
    display_name = "Canary server error rate"

    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.canary_service}\" metric.labels.response_code_class=\"5xx\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].name]
}

resource "google_monitoring_alert_policy" "canary_latency" {
  project      = var.project_id
  display_name = "${var.dashboard_name} canary latency"
  combiner     = "OR"

  conditions {
    display_name = "Canary request latency"

    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${var.canary_service}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 500
      duration        = "300s"

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_PERCENTILE_95"
      }
    }
  }

  notification_channels = var.notification_email == "" ? [] : [google_monitoring_notification_channel.email[0].name]
}

locals {
  run_filter = "resource.type=\"cloud_run_revision\""

  # Paneles stable vs canary: cada uno dibuja una serie por servicio.
  dashboard_panels = [
    {
      title     = "Tráfico (req/s)"
      metric    = "run.googleapis.com/request_count"
      extra     = ""
      aligner   = "ALIGN_RATE"
      reducer   = "REDUCE_SUM"
      threshold = null
    },
    {
      title     = "Errores 5xx (req/s)"
      metric    = "run.googleapis.com/request_count"
      extra     = " metric.labels.response_code_class=\"5xx\""
      aligner   = "ALIGN_RATE"
      reducer   = "REDUCE_SUM"
      threshold = null
    },
    {
      title     = "Errores 4xx (req/s)"
      metric    = "run.googleapis.com/request_count"
      extra     = " metric.labels.response_code_class=\"4xx\""
      aligner   = "ALIGN_RATE"
      reducer   = "REDUCE_SUM"
      threshold = null
    },
    {
      title     = "Latencia p50 (ms)"
      metric    = "run.googleapis.com/request_latencies"
      extra     = ""
      aligner   = "ALIGN_PERCENTILE_50"
      reducer   = "REDUCE_MAX"
      threshold = null
    },
    {
      title     = "Latencia p95 (ms) - SLO 500 ms"
      metric    = "run.googleapis.com/request_latencies"
      extra     = ""
      aligner   = "ALIGN_PERCENTILE_95"
      reducer   = "REDUCE_MAX"
      threshold = 500
    },
    {
      title     = "Latencia p99 (ms)"
      metric    = "run.googleapis.com/request_latencies"
      extra     = ""
      aligner   = "ALIGN_PERCENTILE_99"
      reducer   = "REDUCE_MAX"
      threshold = null
    },
    {
      title     = "CPU utilization p95"
      metric    = "run.googleapis.com/container/cpu/utilizations"
      extra     = ""
      aligner   = "ALIGN_PERCENTILE_95"
      reducer   = "REDUCE_MAX"
      threshold = null
    },
    {
      title     = "Memory utilization p95"
      metric    = "run.googleapis.com/container/memory/utilizations"
      extra     = ""
      aligner   = "ALIGN_PERCENTILE_95"
      reducer   = "REDUCE_MAX"
      threshold = null
    },
    {
      title     = "Instancias activas"
      metric    = "run.googleapis.com/container/instance_count"
      extra     = ""
      aligner   = "ALIGN_MAX"
      reducer   = "REDUCE_SUM"
      threshold = null
    },
  ]
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
