locals {
  secret_ids = {
    database_url  = "database-url"
    chaos_token   = "chaos-token"
    otel_endpoint = "otel-endpoint"
    otel_headers  = "otel-headers"
  }

  secret_values = {
    database_url  = var.database_url
    chaos_token   = var.chaos_token
    otel_endpoint = var.otel_exporter_endpoint != "" ? var.otel_exporter_endpoint : "disabled"
    otel_headers  = var.otel_exporter_headers != "" ? var.otel_exporter_headers : "disabled"
  }
}

resource "google_secret_manager_secret" "this" {
  for_each = local.secret_ids

  project   = var.project_id
  secret_id = "${var.name_prefix}-${each.value}"
  labels    = var.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "this" {
  for_each = local.secret_ids

  secret      = google_secret_manager_secret.this[each.key].id
  secret_data = local.secret_values[each.key]
}
