output "name" {
  description = "Name of the private Blob Storage container."
  value       = azurerm_storage_container.this.name
}
