variable "name_prefix" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tenant_id" { type = string }
variable "database_url" {
  type      = string
  sensitive = true
}
variable "tags" { type = map(string) }
