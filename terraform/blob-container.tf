module "blob_container" {
  source               = "./modules/blob-container"
  storage_account_name = module.storage_account.name
  container_name       = "flow-artifacts"
}
