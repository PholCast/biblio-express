output "id" {
  description = "Resource ID of the Azure Storage Account."
  value       = azurerm_storage_account.this.id
}

output "name" {
  description = "Name of the Azure Storage Account."
  value       = azurerm_storage_account.this.name
}
