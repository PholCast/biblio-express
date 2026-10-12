output "resource_group_name" {
  description = "Name of the Azure Resource Group containing the application infrastructure."
  value       = module.resource_group.name
}

output "api_url" {
  description = "Public HTTPS URL of the Biblio Express API."
  value       = "https://${module.api_app_service.default_hostname}"
}

output "object_storage_url" {
  description = "Public HTTPS URL of the Object Storage service."
  value       = "https://${module.object_storage_app_service.default_hostname}"
}

output "container_registry_login_server" {
  description = "Login server URL of the Azure Container Registry."
  value       = module.container_registry.login_server
}

output "postgresql_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL Flexible Server."
  value       = module.postgresql.fqdn
}

output "storage_account_name" {
  description = "Name of the Azure Storage Account used for flow artifacts."
  value       = module.storage_account.name
}

output "key_vault_name" {
  description = "Name of the Azure Key Vault storing application secrets."
  value       = "kv-${local.name_prefix}"
}

output "acr_pull_role_assignment_id" {
  description = "Resource ID of the AcrPull assignment for the managed identity."
  value       = module.role_assignments.acr_pull_role_id
}

output "blob_contributor_role_assignment_id" {
  description = "Resource ID of the Storage Blob Data Contributor assignment for the managed identity."
  value       = module.role_assignments.blob_contributor_role_id
}

output "key_vault_secrets_user_role_assignment_id" {
  description = "Resource ID of the Key Vault Secrets User assignment for the managed identity."
  value       = module.role_assignments.key_vault_secrets_user_role_id
}
