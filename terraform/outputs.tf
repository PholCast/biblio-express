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
