data "google_project" "this" {
  project_id = var.project_id

  depends_on = [google_project_service.required]
}

output "project_id" {
  value = data.google_project.this.project_id
}

output "project_number" {
  value = data.google_project.this.number
}
