output "id" {
  description = "Resource ID of the Linux Web App."
  value       = azurerm_linux_web_app.this.id
}

output "default_hostname" {
  description = "Default hostname of the Linux Web App."
  value       = azurerm_linux_web_app.this.default_hostname
}
