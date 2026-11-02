module "artifact_registry" {
  source = "./modules/artifact-registry"

  project_id    = module.project.project_id
  location      = var.region
  repository_id = var.artifact_repository_id
  labels        = local.common_labels
}
