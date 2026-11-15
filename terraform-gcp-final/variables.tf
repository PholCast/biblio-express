variable "project_id" {
  description = "Google Cloud project ID. The project is created when create_project is true."
  type        = string
}

variable "state_project_id" {
  description = "Project that owns the tfstate bucket. Must differ from project_id."
  type        = string
}

variable "create_project" {
  description = "Whether Terraform should create the Google Cloud project."
  type        = bool
  default     = false
}

variable "project_name" {
  description = "Display name for a newly created Google Cloud project."
  type        = string
  default     = "Biblio Express Final"
}

variable "billing_account_id" {
  description = "Billing account ID required when creating a project."
  type        = string
  default     = null
  nullable    = true
}

variable "folder_id" {
  description = "Google Cloud folder ID for a newly created project."
  type        = string
  default     = null
  nullable    = true
}

variable "organization_id" {
  description = "Google Cloud organization ID for a newly created project."
  type        = string
  default     = null
  nullable    = true
}

variable "region" {
  description = "Primary Google Cloud region."
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Primary Google Cloud zone."
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "final"
}

variable "service_name" {
  description = "Base name used for GCP resources."
  type        = string
  default     = "biblio-express"
}

variable "artifact_repository_id" {
  description = "Artifact Registry repository ID."
  type        = string
  default     = "biblio-api"
}

variable "image" {
  description = "Immutable container image URI for the API service."
  type        = string
}

variable "app_version" {
  description = "Application version advertised by the service."
  type        = string
  default     = "5.0.0"
}

variable "cloud_sql_database" {
  description = "PostgreSQL database name."
  type        = string
  default     = "bibliodb"
}

variable "cloud_sql_user" {
  description = "PostgreSQL application user."
  type        = string
  default     = "biblioapp"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL machine tier."
  type        = string
  default     = "db-f1-micro"
}

variable "min_instances" {
  description = "Minimum Cloud Run instances. One keeps the service warm."
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum Cloud Run instances. One keeps a single DB pool, so the fault injection is deterministic."
  type        = number
  default     = 1
}

variable "max_request_concurrency" {
  description = "Maximum concurrent requests per Cloud Run instance."
  type        = number
  default     = 80
}

variable "cpu_limit" {
  description = "CPU limit of the API container."
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit of the API container."
  type        = string
  default     = "512Mi"
}

variable "cpu_always_allocated" {
  description = "Keep CPU allocated outside requests so the fault auto-revert timer and the telemetry export keep running."
  type        = bool
  default     = true
}

variable "db_pool_max" {
  description = "Maximum size of the PostgreSQL connection pool (resource exhausted by the experiment)."
  type        = number
  default     = 10
}

variable "resilience_enabled" {
  description = "Enable the resilience patterns. false = Round 0 (unprotected), true = Round 1."
  type        = bool
  default     = false
}

variable "db_pool_acquire_timeout_ms" {
  description = "Pool acquisition timeout applied when resilience_enabled is true. It also bounds opening a new connection."
  type        = number
  default     = 1000
}

variable "stale_cache_ttl_seconds" {
  description = "Maximum age of a stale response served when the database is unavailable."
  type        = number
  default     = 300
}

variable "chaos_enabled" {
  description = "Expose the fault injection switch (/chaos routes)."
  type        = bool
  default     = false
}

variable "chaos_token" {
  description = "Token required by the x-chaos-token header."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
}

variable "doctors_api_url" {
  description = "Base URL of the doctors API (teammate). Empty disables the call."
  type        = string
  default     = ""
}

variable "pokemon_api_url" {
  description = "Base URL of the pokemon API (teammate). Empty disables the call."
  type        = string
  default     = ""
}

variable "otel_exporter_endpoint" {
  description = "Optional OTLP endpoint, for example a Grafana Cloud endpoint."
  type        = string
  default     = ""
}

variable "otel_exporter_headers" {
  description = "Optional OTLP headers encoded as a secret value."
  type        = string
  sensitive   = true
  default     = ""
}

variable "otel_exporter_otlp_protocol" {
  description = "OTLP transport protocol used by the OpenTelemetry exporters."
  type        = string
  default     = "http/protobuf"
}

variable "github_repository" {
  description = "GitHub repository in owner/name format allowed to use WIF."
  type        = string
}

variable "github_branch" {
  description = "GitHub branch allowed to deploy through WIF."
  type        = string
  default     = "main"
}

variable "notification_email" {
  description = "Optional email for Cloud Monitoring notifications."
  type        = string
  default     = ""
}

variable "p95_threshold_ms" {
  description = "p95 latency threshold shown on the dashboard and used by the alert."
  type        = number
  default     = 500
}

variable "max_5xx_rate" {
  description = "Maximum 5xx ratio shown on the dashboard and used by the alert."
  type        = number
  default     = 0.01
}

variable "deletion_protection" {
  description = "Protect the Cloud SQL instance and the Cloud Run service from deletion."
  type        = bool
  default     = false
}
