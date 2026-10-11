module "object_storage_app_service" {
  source                     = "./modules/app-service"
  name_prefix                = "${local.name_prefix}-storage"
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  service_plan_id            = module.app_service_plan.id
  managed_identity_id        = module.managed_identity.id
  managed_identity_client_id = module.managed_identity.client_id
  registry_login_server      = module.container_registry.login_server
  image_repository           = var.object_storage_image_repository
  image_tag                  = var.object_storage_image_tag
  port                       = 3001
  app_settings = {
    NODE_ENV                     = var.environment
    PORT                         = "3001"
    AZURE_STORAGE_ACCOUNT_NAME   = module.storage_account.name
    AZURE_STORAGE_CONTAINER_NAME = module.blob_container.name
  }
  tags       = local.common_tags
  depends_on = [module.role_assignments]
}
