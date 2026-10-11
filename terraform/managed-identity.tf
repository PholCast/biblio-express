module "managed_identity" {
  source              = "./modules/managed-identity"
  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = local.common_tags
}
