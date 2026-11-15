output "project_id" {
  description = "Google Cloud project hosting the deployment."
  value       = module.project.project_id
}

output "artifact_registry_repository" {
  description = "Docker repository URL."
  value       = module.artifact_registry.repository_url
}

output "service_name" {
  description = "Cloud Run service running the API."
  value       = module.api.service_name
}

output "service_url" {
  description = "Public URL of the Cloud Run service."
  value       = module.api.uri
}

output "dashboard_id" {
  description = "Cloud Monitoring dashboard for the chaos experiment."
  value       = module.monitoring.dashboard_id
}

output "github_workload_identity_provider" {
  description = "WIF provider resource for GitHub Actions."
  value       = module.iam.workload_identity_provider
}

output "github_deployer_service_account" {
  description = "Service account email for GitHub Actions."
  value       = module.iam.deployer_service_account_email
}
