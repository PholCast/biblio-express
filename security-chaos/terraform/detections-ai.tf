# Rule gd3-ai-agent-guard (plan P5). The SOC assistant writes gd-ai-assistant log events in v1.
resource "google_monitoring_alert_policy" "ai_agent_guard" {
  project      = var.project_id
  display_name = "gd3-ai-agent-guard"
  combiner     = "OR"

  conditions {
    display_name = "SOC assistant flagged an injection or blocked an effect action"
    condition_matched_log {
      filter = <<-EOT
        logName="projects/${var.project_id}/logs/gd-ai-assistant"
        AND jsonPayload.event=("ai_injection_suspected" OR "ai_effect_action_blocked")
      EOT
    }
  }

  alert_strategy {
    notification_rate_limit { period = "300s" }
  }

  notification_channels = local.alert_channels
  documentation {
    content   = "Exp. 3 (capa de IA): AML.T0051.001. El asistente detectó o bloqueó una inyección."
    mime_type = "text/markdown"
  }
}
