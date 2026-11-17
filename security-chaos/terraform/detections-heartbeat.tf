# Exp. 3 mejora 1: telemetry heartbeat (plan P5). Uptime check feeds steady logs; a bucket-scoped
# metric goes absent when gd3-blind excludes them.
# --- Heartbeat: an uptime check feeds steady logs; the metric goes absent when logs are excluded ---
resource "google_monitoring_uptime_check_config" "health" {
  project      = var.project_id
  display_name = "gd3-biblio-health"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = "biblio-express-final-api-cruuw4ggmq-uc.a.run.app"
    }
  }
}

# Bucket-scoped so the count drops to zero when gd3-blind excludes the logs (a project-scoped
# metric is computed BEFORE exclusions and would not drop). Plan P5.
resource "google_logging_metric" "telemetry_heartbeat" {
  project     = var.project_id
  name        = "gd3_telemetry_heartbeat"
  filter      = local.svc_filter
  bucket_name = "projects/${var.project_id}/locations/global/buckets/_Default"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }
}

resource "google_monitoring_alert_policy" "telemetry_heartbeat_absent" {
  project      = var.project_id
  display_name = "gd3-telemetry-heartbeat-absent"
  combiner     = "OR"

  conditions {
    display_name = "service logs stopped reaching _Default"
    condition_absent {
      # Bucket-scoped log metrics report under the logging_bucket resource, not cloud_run_revision.
      filter   = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.telemetry_heartbeat.name}\" resource.type=\"logging_bucket\""
      duration = "300s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_COUNT"
        cross_series_reducer = "REDUCE_SUM"
      }
      trigger { count = 1 }
    }
  }

  notification_channels = local.alert_channels
  documentation {
    content   = "Exp. 3: ausencia de latido de telemetría (T1685.002). Los logs del servicio dejaron de llegar."
    mime_type = "text/markdown"
  }
}

