# Detección como código (plan P5/C9). Three rules, each with a positive and negative test
# under security-chaos/detections/tests/.

locals {
  svc_filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.run_service}\""
}

# --- Rule gd3-telemetry-tamper: someone edits sinks, exclusions, alerts or log buckets ---
resource "google_monitoring_alert_policy" "telemetry_tamper" {
  project      = var.project_id
  display_name = "gd3-telemetry-tamper"
  combiner     = "OR"

  conditions {
    display_name = "logging or monitoring configuration changed"
    condition_matched_log {
      filter = <<-EOT
        protoPayload.serviceName=("logging.googleapis.com" OR "monitoring.googleapis.com")
        AND protoPayload.methodName=("google.logging.v2.ConfigServiceV2.UpdateSink"
          OR "google.logging.v2.ConfigServiceV2.UpdateExclusion"
          OR "google.logging.v2.ConfigServiceV2.CreateExclusion"
          OR "google.logging.v2.ConfigServiceV2.UpdateBucket"
          OR "google.monitoring.v3.AlertPolicyService.UpdateAlertPolicy"
          OR "google.monitoring.v3.AlertPolicyService.DeleteAlertPolicy")
      EOT
    }
  }

  alert_strategy {
    notification_rate_limit { period = "300s" }
  }

  notification_channels = local.alert_channels
  documentation {
    content   = "Exp. 3: manipulación de telemetría (T1685.002 / T1685). Revisar quién cambió sinks o alertas."
    mime_type = "text/markdown"
  }
}

