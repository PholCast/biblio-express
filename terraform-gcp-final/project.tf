module "project" {
  source = "./modules/project"

  project_id      = var.project_id
  project_name    = var.project_name
  create_project  = var.create_project
  billing_account = var.billing_account_id
  folder_id       = var.folder_id
  organization_id = var.organization_id
  required_services = [
    "cloudresourcemanager.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "serviceusage.googleapis.com",
  ]
}
