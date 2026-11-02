variable "project_id" {
  type = string
}

variable "project_name" {
  type = string
}

variable "create_project" {
  type = bool
}

variable "billing_account" {
  type     = string
  nullable = true
}

variable "folder_id" {
  type     = string
  nullable = true
}

variable "organization_id" {
  type     = string
  nullable = true
}

variable "required_services" {
  type = list(string)
}
