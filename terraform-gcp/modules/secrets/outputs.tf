output "database_url_id" {
  value = google_secret_manager_secret.database_url.secret_id
}

output "canary_fault_token_id" {
  value = google_secret_manager_secret.canary_fault_token.secret_id
}

output "otel_exporter_endpoint_id" {
  value = google_secret_manager_secret.otel_endpoint.secret_id
}

output "otel_exporter_headers_id" {
  value = google_secret_manager_secret.otel_headers.secret_id
}
