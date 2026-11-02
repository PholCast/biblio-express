module "monitoring" {
  source = "./modules/monitoring"

  project_id         = module.project.project_id
  stable_service     = module.stable.service_name
  canary_service     = module.canary.service_name
  notification_email = var.notification_email
  dashboard_name     = "${local.name_prefix}-dashboard"
}
