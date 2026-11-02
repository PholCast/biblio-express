module "load_balancer" {
  source = "./modules/load-balancer"

  project_id             = module.project.project_id
  region                 = var.region
  name                   = local.name_prefix
  stable_service_name    = module.stable.service_name
  canary_service_name    = module.canary.service_name
  stable_traffic_percent = var.stable_traffic_percent
  canary_traffic_percent = var.canary_traffic_percent
}
