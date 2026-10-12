variable "storage_account_id" { type = string }
variable "container_registry_id" { type = string }
variable "key_vault_id" { type = string }
variable "principal_id" { type = string }
variable "portal_principal_id" {
  type     = string
  default  = null
  nullable = true
}
