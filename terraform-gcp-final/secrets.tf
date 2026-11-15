module "secrets" {
  source = "./modules/secrets"

  project_id             = module.project.project_id
  name_prefix            = local.name_prefix
  database_url           = module.cloud_sql.database_url
  chaos_token            = coalesce(var.chaos_token, "replace-before-enabling-chaos")
  otel_exporter_endpoint = var.otel_exporter_endpoint
  otel_exporter_headers  = var.otel_exporter_headers
  labels                 = local.common_labels
}
