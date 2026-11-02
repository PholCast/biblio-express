resource "google_secret_manager_secret" "database_url" {
  project   = var.project_id
  secret_id = "${var.name_prefix}-database-url"
  labels    = var.labels
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}

resource "google_secret_manager_secret" "canary_fault_token" {
  project   = var.project_id
  secret_id = "${var.name_prefix}-canary-fault-token"
  labels    = var.labels
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "canary_fault_token" {
  secret      = google_secret_manager_secret.canary_fault_token.id
  secret_data = var.canary_fault_token
}

resource "google_secret_manager_secret" "otel_endpoint" {
  project   = var.project_id
  secret_id = "${var.name_prefix}-otel-endpoint"
  labels    = var.labels
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "otel_endpoint" {
  secret      = google_secret_manager_secret.otel_endpoint.id
  secret_data = var.otel_exporter_endpoint
}

resource "google_secret_manager_secret" "otel_headers" {
  project   = var.project_id
  secret_id = "${var.name_prefix}-otel-headers"
  labels    = var.labels
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "otel_headers" {
  secret      = google_secret_manager_secret.otel_headers.id
  secret_data = var.otel_exporter_headers
}
