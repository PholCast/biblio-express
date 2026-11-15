# Los ids dependen de las versiones para que Cloud Run no cree una revisión
# antes de que cada secreto tenga un valor.
output "database_url_id" {
  value      = google_secret_manager_secret.this["database_url"].secret_id
  depends_on = [google_secret_manager_secret_version.this]
}

output "chaos_token_id" {
  value      = google_secret_manager_secret.this["chaos_token"].secret_id
  depends_on = [google_secret_manager_secret_version.this]
}

output "otel_exporter_endpoint_id" {
  value      = google_secret_manager_secret.this["otel_endpoint"].secret_id
  depends_on = [google_secret_manager_secret_version.this]
}

output "otel_exporter_headers_id" {
  value      = google_secret_manager_secret.this["otel_headers"].secret_id
  depends_on = [google_secret_manager_secret_version.this]
}
