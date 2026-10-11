module "blob_container" {
  source             = "./modules/blob-container"
  storage_account_id = module.storage_account.id
  container_name     = "flow-artifacts"
}
