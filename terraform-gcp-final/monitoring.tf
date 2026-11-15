module "monitoring" {
  source = "./modules/monitoring"

  project_id         = module.project.project_id
  service_name       = module.api.service_name
  dashboard_name     = "${local.name_prefix}-chaos-dashboard"
  notification_email = var.notification_email
  p95_threshold_ms   = var.p95_threshold_ms
  max_5xx_rate       = var.max_5xx_rate
}
