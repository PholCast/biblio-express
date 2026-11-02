resource "google_cloud_run_v2_service" "this" {
  project  = var.project_id
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = var.labels

  template {
    service_account = var.execution_service_account
    timeout         = "60s"

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.cloud_sql_connection_name]
      }
    }

    containers {
      image = var.image

      ports {
        container_port = 3000
      }

      env {
        name  = "PORT"
        value = "3000"
      }
      env {
        name  = "APP_VERSION"
        value = var.app_version
      }
      env {
        name  = "APP_TRACK"
        value = var.app_track
      }
      env {
        name  = "CANARY_FAULTS_ENABLED"
        value = var.canary_faults_enabled ? "true" : "false"
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = var.database_url_secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "CANARY_FAULT_TOKEN"
        value_source {
          secret_key_ref {
            secret  = var.canary_fault_token_secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OTEL_EXPORTER_OTLP_ENDPOINT"
        value_source {
          secret_key_ref {
            secret  = var.otel_endpoint_secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "OTEL_EXPORTER_OTLP_HEADERS"
        value_source {
          secret_key_ref {
            secret  = var.otel_headers_secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
