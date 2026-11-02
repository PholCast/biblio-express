module "stable" {
  source = "./modules/cloud-run"

  project_id                   = module.project.project_id
  region                       = var.region
  service_name                 = "${local.name_prefix}-stable"
  image                        = var.stable_image
  app_version                  = var.stable_version
  app_track                    = "stable"
  execution_service_account    = module.iam.runtime_service_account_email
  cloud_sql_connection_name    = module.cloud_sql.connection_name
  database_url_secret_id       = module.secrets.database_url_id
  canary_fault_token_secret_id = module.secrets.canary_fault_token_id
  otel_endpoint_secret_id      = module.secrets.otel_exporter_endpoint_id
  otel_headers_secret_id       = module.secrets.otel_exporter_headers_id
  canary_faults_enabled        = false
  labels                       = local.common_labels
}

module "canary" {
  source = "./modules/cloud-run"

  project_id                   = module.project.project_id
  region                       = var.region
  service_name                 = "${local.name_prefix}-canary"
  image                        = var.canary_image
  app_version                  = var.canary_version
  app_track                    = "canary"
  execution_service_account    = module.iam.runtime_service_account_email
  cloud_sql_connection_name    = module.cloud_sql.connection_name
  database_url_secret_id       = module.secrets.database_url_id
  canary_fault_token_secret_id = module.secrets.canary_fault_token_id
  otel_endpoint_secret_id      = module.secrets.otel_exporter_endpoint_id
  otel_headers_secret_id       = module.secrets.otel_exporter_headers_id
  canary_faults_enabled        = var.canary_faults_enabled
  labels                       = local.common_labels
}
