output "acr_pull_role_id" {
  description = "Resource ID of the AcrPull role assignment."
  value       = azurerm_role_assignment.acr_pull.id
}

output "blob_contributor_role_id" {
  description = "Resource ID of the Storage Blob Data Contributor assignment."
  value       = azurerm_role_assignment.blob_data_contributor.id
}

output "key_vault_secrets_user_role_id" {
  description = "Resource ID of the Key Vault Secrets User assignment."
  value       = azurerm_role_assignment.key_vault_secrets_user.id
}
