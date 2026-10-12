module "role_assignments" {
  source                = "./modules/role-assignments"
  storage_account_id    = module.storage_account.id
  container_registry_id = module.container_registry.id
  key_vault_id          = module.key_vault.id
  principal_id          = module.managed_identity.principal_id
  portal_principal_id   = var.portal_principal_id
  depends_on            = [module.blob_container]
}
