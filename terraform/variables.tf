variable "subscription_id" {
  description = "Azure subscription where the resources will be created."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.subscription_id))
    error_message = "subscription_id must be a valid Azure UUID."
  }
}

variable "tenant_id" {
  description = "Microsoft Entra tenant that owns the subscription."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", var.tenant_id))
    error_message = "tenant_id must be a valid Microsoft Entra UUID."
  }
}

variable "project_name" {
  description = "Prefijo común para nombres de recursos Azure."
  type        = string
  default     = "biblio"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.project_name))
    error_message = "project_name must be between 3 and 20 characters and contain only lowercase letters, numbers, or hyphens."
  }
}

variable "environment" {
  description = "Ambiente desplegado."
  type        = string
  default     = "dev"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,9}$", var.environment))
    error_message = "environment must be between 2 and 10 characters and contain only lowercase letters, numbers, or hyphens."
  }
}

variable "location" {
  description = "Región de Azure."
  type        = string
  default     = "East US"

  validation {
    condition     = length(trimspace(var.location)) > 0
    error_message = "location cannot be empty."
  }
}

variable "resource_group_name" {
  description = "Nombre opcional del Resource Group."
  type        = string
  default     = null

  validation {
    condition     = var.resource_group_name == null || can(regex("^[A-Za-z0-9._()-]{1,90}$", var.resource_group_name))
    error_message = "resource_group_name may contain only valid Azure characters and must be at most 90 characters long."
  }
}

variable "postgres_admin_username" {
  description = "Usuario administrador de PostgreSQL."
  type        = string
  default     = "biblioadmin"

  validation {
    condition     = can(regex("^[a-z][a-z0-9_]{2,31}$", var.postgres_admin_username))
    error_message = "postgres_admin_username must be between 3 and 32 characters and contain only lowercase letters, numbers, or underscores."
  }
}

variable "postgres_admin_password" {
  description = "Strong PostgreSQL administrator password. Keep it in tfvars or an environment variable, never commit it."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.postgres_admin_password) >= 12 && !can(regex("[[:space:]]", var.postgres_admin_password))
    error_message = "postgres_admin_password must be at least 12 characters long and must not contain spaces."
  }
}

variable "postgres_database_name" {
  description = "Nombre de la base de datos de la aplicación."
  type        = string
  default     = "bibliodb"

  validation {
    condition     = can(regex("^[a-z][a-z0-9_]{0,62}$", var.postgres_database_name))
    error_message = "postgres_database_name must start with a lowercase letter and contain only lowercase letters, numbers, or underscores."
  }
}

variable "api_image_repository" {
  description = "Repositorio de la imagen de la API en ACR."
  type        = string
  default     = "biblio-express"

  validation {
    condition     = can(regex("^[a-z0-9]+([._-][a-z0-9]+)*$", var.api_image_repository))
    error_message = "api_image_repository contains invalid characters for a Docker repository."
  }
}

variable "api_image_tag" {
  description = "Tag de la imagen de la API."
  type        = string
  default     = "latest"

  validation {
    condition     = can(regex("^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$", var.api_image_tag))
    error_message = "api_image_tag must be a valid Docker tag of up to 128 characters."
  }
}

variable "object_storage_image_repository" {
  description = "Repositorio de la imagen de Object Storage en ACR."
  type        = string
  default     = "biblio-object-storage"

  validation {
    condition     = can(regex("^[a-z0-9]+([._-][a-z0-9]+)*$", var.object_storage_image_repository))
    error_message = "object_storage_image_repository contains invalid characters for a Docker repository."
  }
}

variable "object_storage_image_tag" {
  description = "Tag de la imagen de Object Storage."
  type        = string
  default     = "latest"

  validation {
    condition     = can(regex("^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$", var.object_storage_image_tag))
    error_message = "object_storage_image_tag must be a valid Docker tag of up to 128 characters."
  }
}

variable "object_storage_timeout_ms" {
  description = "Timeout de llamadas de la API a Object Storage."
  type        = number
  default     = 5000

  validation {
    condition     = var.object_storage_timeout_ms >= 1000 && var.object_storage_timeout_ms <= 120000
    error_message = "object_storage_timeout_ms must be between 1000 and 120000 milliseconds."
  }
}

variable "external_doctors_api_url" {
  description = "URL opcional del servicio externo de doctores."
  type        = string
  default     = ""

  validation {
    condition     = var.external_doctors_api_url == "" || can(regex("^https?://[^[:space:]]+$", var.external_doctors_api_url))
    error_message = "external_doctors_api_url must be empty or start with http:// or https://."
  }
}

variable "external_pokemon_api_url" {
  description = "URL opcional del servicio externo de Pokémon."
  type        = string
  default     = ""

  validation {
    condition     = var.external_pokemon_api_url == "" || can(regex("^https?://[^[:space:]]+$", var.external_pokemon_api_url))
    error_message = "external_pokemon_api_url must be empty or start with http:// or https://."
  }
}
