# El estado remoto vive en un bucket de Cloud Storage que pertenece a un
# proyecto DISTINTO al de la aplicación (ver bootstrap-state.ps1). Así,
# terraform destroy puede eliminar todo el proyecto de la aplicación sin
# borrar ni dejar inaccesible su propio estado.
terraform {
  backend "gcs" {}
}

resource "terraform_data" "state_isolation" {
  input = var.state_project_id

  lifecycle {
    precondition {
      condition     = var.state_project_id != var.project_id
      error_message = "state_project_id must differ from project_id: the tfstate cannot live inside the application project."
    }
  }
}
