module "api" {
  source = "./modules/cloud-run"

  project_id                = module.project.project_id
  region                    = var.region
  service_name              = "${local.name_prefix}-api"
  image                     = var.image
  execution_service_account = module.iam.runtime_service_account_email
  cloud_sql_connection_name = module.cloud_sql.connection_name
  min_instances             = var.min_instances
  max_instances             = var.max_instances
  max_request_concurrency   = var.max_request_concurrency
  cpu_limit                 = var.cpu_limit
  memory_limit              = var.memory_limit
  cpu_always_allocated      = var.cpu_always_allocated
  deletion_protection       = var.deletion_protection
  env_vars                  = local.runtime_env
  labels                    = local.common_labels

  secret_env_vars = {
    DATABASE_URL                = module.secrets.database_url_id
    CHAOS_TOKEN                 = module.secrets.chaos_token_id
    OTEL_EXPORTER_OTLP_ENDPOINT = module.secrets.otel_exporter_endpoint_id
    OTEL_EXPORTER_OTLP_HEADERS  = module.secrets.otel_exporter_headers_id
  }

  # El servicio necesita los permisos del runtime y las versiones de los
  # secretos antes de crear su primera revisión.
  depends_on = [module.iam, module.secrets]
}
