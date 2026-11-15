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
