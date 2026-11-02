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

resource "google_monitoring_dashboard" "this" {
  project = var.project_id
  dashboard_json = jsonencode({
    displayName = var.dashboard_name
    gridLayout = {
      columns = "2"
      widgets = [
        {
          title = "Request rate: stable vs canary"
          xyChart = {
            dataSets = [
              for service in [var.stable_service, var.canary_service] : {
                legendTemplate = service
                plotType       = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${service}\""
                    aggregation = {
                      alignmentPeriod    = "60s"
                      perSeriesAligner   = "ALIGN_RATE"
                      crossSeriesReducer = "REDUCE_SUM"
                    }
                  }
                }
              }
            ]
          }
        },
        {
          title = "Request latency p95"
          xyChart = {
            dataSets = [
              for service in [var.stable_service, var.canary_service] : {
                legendTemplate = service
                plotType       = "LINE"
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "metric.type=\"run.googleapis.com/request_latencies\" resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${service}\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_PERCENTILE_95"
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  })
}
