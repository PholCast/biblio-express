variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "service_name" {
  type = string
}

variable "image" {
  type = string
}

variable "app_version" {
  type = string
}

variable "app_track" {
  type = string
}

variable "execution_service_account" {
  type = string
}

variable "cloud_sql_connection_name" {
  type    = string
  default = ""
}

variable "database_url_secret_id" {
  type = string
}

variable "canary_fault_token_secret_id" {
  type = string
}

variable "otel_endpoint_secret_id" {
  type = string
}

variable "otel_headers_secret_id" {
  type = string
}

variable "canary_faults_enabled" {
  type = bool
}

variable "labels" {
  type    = map(string)
  default = {}
}
