module "secrets" {
  source = "./modules/secrets"

  project_id             = module.project.project_id
  database_url           = module.cloud_sql.database_url
  canary_fault_token     = coalesce(var.canary_fault_token, "replace-before-enabling-faults")
  otel_exporter_endpoint = var.otel_exporter_endpoint
  otel_exporter_headers  = var.otel_exporter_headers
  labels                 = local.common_labels
}
