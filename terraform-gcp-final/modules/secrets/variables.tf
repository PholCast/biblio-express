variable "project_id" {
  type = string
}

variable "name_prefix" {
  type    = string
  default = "biblio-express"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "chaos_token" {
  type      = string
  sensitive = true
}

variable "otel_exporter_endpoint" {
  type = string
}

variable "otel_exporter_headers" {
  type      = string
  sensitive = true
}

variable "labels" {
  type    = map(string)
  default = {}
}
