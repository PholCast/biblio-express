output "id" {
  description = "Resource ID of the Azure Key Vault."
  value       = azurerm_key_vault.this.id
}

output "database_url_secret_id" {
  description = "Versioned resource ID of the database URL secret."
  value       = azurerm_key_vault_secret.database_url.id
}
