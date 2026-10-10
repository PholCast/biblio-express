output "name" {
  description = "Name of the Azure Resource Group."
  value       = azurerm_resource_group.this.name
}

output "location" {
  description = "Azure region of the Resource Group."
  value       = azurerm_resource_group.this.location
}
