module "cloud_sql" {
  source = "./modules/cloud-sql"

  project_id          = module.project.project_id
  region              = var.region
  instance_name       = "${local.name_prefix}-postgres"
  database_name       = var.cloud_sql_database
  user_name           = var.cloud_sql_user
  tier                = var.cloud_sql_tier
  deletion_protection = var.deletion_protection
}
