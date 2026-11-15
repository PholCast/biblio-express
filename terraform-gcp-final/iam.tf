module "iam" {
  source = "./modules/iam"

  project_id        = module.project.project_id
  project_number    = module.project.project_number
  service_name      = local.name_prefix
  github_repository = var.github_repository
  github_branch     = var.github_branch
}
