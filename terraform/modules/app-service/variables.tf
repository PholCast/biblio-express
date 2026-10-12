variable "name_prefix" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "service_plan_id" { type = string }
variable "managed_identity_id" { type = string }
variable "managed_identity_client_id" {
  type    = string
  default = null
}
variable "registry_login_server" { type = string }
variable "image_repository" { type = string }
variable "image_tag" { type = string }
variable "port" { type = number }
variable "app_settings" { type = map(string) }
variable "tags" { type = map(string) }
