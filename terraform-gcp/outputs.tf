output "project_id" {
  description = "Google Cloud project hosting the deployment."
  value       = module.project.project_id
}

output "artifact_registry_repository" {
  description = "Docker repository URL."
  value       = module.artifact_registry.repository_url
}

output "stable_service_url" {
  description = "Direct stable Cloud Run URL."
  value       = module.stable.uri
}

output "canary_service_url" {
  description = "Direct canary Cloud Run URL."
  value       = module.canary.uri
}

output "load_balancer_ip" {
  description = "Public IP of the Application Load Balancer."
  value       = module.load_balancer.ip_address
}

output "load_balancer_url" {
  description = "HTTP URL of the Application Load Balancer."
  value       = "http://${module.load_balancer.ip_address}"
}

output "github_workload_identity_provider" {
  description = "WIF provider resource for GitHub Actions."
  value       = module.iam.workload_identity_provider
}

output "github_deployer_service_account" {
  description = "Service account email for GitHub Actions."
  value       = module.iam.deployer_service_account_email
}
