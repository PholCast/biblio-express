resource "azurerm_user_assigned_identity" "this" {
  name                = "id-${var.name_prefix}"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}
