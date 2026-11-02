variable "project_id" {
  description = "Google Cloud project ID. The project is created when create_project is true."
  type        = string
}

variable "create_project" {
  description = "Whether Terraform should create the Google Cloud project."
  type        = bool
  default     = true
}

variable "project_name" {
  description = "Display name for a newly created Google Cloud project."
  type        = string
  default     = "Biblio Express Canary"
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
  default     = "demo"
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

variable "stable_image" {
  description = "Immutable container image URI for the stable service."
  type        = string
}

variable "canary_image" {
  description = "Immutable container image URI for the canary service."
  type        = string
}

variable "stable_version" {
  description = "Application version advertised by the stable service."
  type        = string
  default     = "3.0.1"
}

variable "canary_version" {
  description = "Application version advertised by the canary service."
  type        = string
  default     = "4.0.0"
}

variable "stable_traffic_percent" {
  description = "Initial percentage routed to stable."
  type        = number
  default     = 100
}

variable "canary_traffic_percent" {
  description = "Initial percentage routed to canary."
  type        = number
  default     = 0
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

variable "canary_faults_enabled" {
  description = "Enable controlled fault injection in the canary service."
  type        = bool
  default     = false
}

variable "canary_fault_token" {
  description = "Token used to authorize canary fault injection."
  type        = string
  sensitive   = true
  default     = null
  nullable    = true
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

variable "deletion_protection" {
  description = "Protect the Cloud SQL instance from accidental deletion."
  type        = bool
  default     = false
}
