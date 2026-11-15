resource "google_project" "this" {
  count = var.create_project ? 1 : 0

  project_id      = var.project_id
  name            = var.project_name
  billing_account = var.billing_account
  folder_id       = var.folder_id
  org_id          = var.organization_id
}

resource "google_project_service" "required" {
  for_each = toset(var.required_services)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false

  depends_on = [google_project.this]
}
