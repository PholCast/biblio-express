output "dashboard_id" {
  value = google_monitoring_dashboard.this.id
}

output "errors_5xx_alert_id" {
  value = google_monitoring_alert_policy.errors_5xx.id
}

output "latency_p95_alert_id" {
  value = google_monitoring_alert_policy.latency_p95.id
}
