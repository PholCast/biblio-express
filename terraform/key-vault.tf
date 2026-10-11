module "key_vault" {
  source              = "./modules/key-vault"
  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tenant_id           = var.tenant_id
  database_url        = local.database_url
  tags                = local.common_tags
  depends_on          = [module.postgresql]
}
