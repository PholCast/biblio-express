resource "azurerm_linux_web_app" "this" {
  name                            = "app-${var.name_prefix}"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  service_plan_id                 = var.service_plan_id
  https_only                      = true
  key_vault_reference_identity_id = var.managed_identity_id
  tags                            = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [var.managed_identity_id]
  }

  site_config {
    always_on                                     = false
    health_check_path                             = "/health"
    health_check_eviction_time_in_min             = 5
    container_registry_use_managed_identity       = true
    container_registry_managed_identity_client_id = var.managed_identity_client_id
    application_stack {
      docker_image_name   = "${var.image_repository}:${var.image_tag}"
      docker_registry_url = "https://${var.registry_login_server}"
    }
  }

  app_settings = merge(var.app_settings, {
    WEBSITES_PORT                       = tostring(var.port)
    WEBSITES_CONTAINER_START_TIME_LIMIT = "1800"
  })
}
