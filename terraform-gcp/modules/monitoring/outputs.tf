output "dashboard_id" {
  value = google_monitoring_dashboard.this.id
}

output "canary_5xx_alert_id" {
  value = google_monitoring_alert_policy.canary_5xx.id
}

output "canary_latency_alert_id" {
  value = google_monitoring_alert_policy.canary_latency.id
}
