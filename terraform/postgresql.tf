module "postgresql" {
  source              = "./modules/postgresql"
  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = "Central US"
  admin_username      = var.postgres_admin_username
  admin_password      = var.postgres_admin_password
  database_name       = var.postgres_database_name
  tags                = local.common_tags
}
