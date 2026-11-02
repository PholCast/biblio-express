locals {
  name_prefix = "${var.service_name}-${var.environment}"

  common_labels = {
    application = var.service_name
    environment = var.environment
    managed_by  = "terraform"
  }
}
