module "api_app_service" {
  source                     = "./modules/app-service"
  name_prefix                = "${local.name_prefix}-api"
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  service_plan_id            = module.app_service_plan.id
  managed_identity_id        = module.managed_identity.id
  managed_identity_client_id = module.managed_identity.client_id
  registry_login_server      = module.container_registry.login_server
  image_repository           = var.api_image_repository
  image_tag                  = var.api_image_tag
  port                       = 3000
  app_command_line           = "pnpm exec prisma migrate deploy && pnpm start"
  app_settings = {
    NODE_ENV                  = var.environment
    PORT                      = "3000"
    DATABASE_URL              = "@Microsoft.KeyVault(SecretUri=${module.key_vault.database_url_secret_id})"
    OBJECT_STORAGE_URL        = "https://${module.object_storage_app_service.default_hostname}"
    OBJECT_STORAGE_TIMEOUT_MS = tostring(var.object_storage_timeout_ms)
    DOCTORS_API_URL           = var.external_doctors_api_url
    POKEMON_API_URL           = var.external_pokemon_api_url
  }
  tags       = local.common_tags
  depends_on = [module.role_assignments]
}
