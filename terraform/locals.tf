locals {
  name_prefix         = "${var.project_name}-${var.environment}"
  resource_group_name = coalesce(var.resource_group_name, "rg-${local.name_prefix}")

  common_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }

  database_url = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${module.postgresql.fqdn}:5432/${var.postgres_database_name}?schema=public&sslmode=require"
}
