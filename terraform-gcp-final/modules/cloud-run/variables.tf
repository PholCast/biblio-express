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

variable "execution_service_account" {
  type = string
}

variable "cloud_sql_connection_name" {
  type = string
}

variable "min_instances" {
  type    = number
  default = 1
}

variable "max_instances" {
  type    = number
  default = 1
}

variable "max_request_concurrency" {
  type    = number
  default = 80
}

variable "cpu_limit" {
  type    = string
  default = "1"
}

variable "memory_limit" {
  type    = string
  default = "512Mi"
}

variable "cpu_always_allocated" {
  type    = bool
  default = true
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "env_vars" {
  description = "Plain environment variables of the container."
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Environment variables read from Secret Manager (name => secret id)."
  type        = map(string)
  default     = {}
}

variable "labels" {
  type    = map(string)
  default = {}
}
