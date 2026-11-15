locals {
  name_prefix = "${var.service_name}-${var.environment}"

  common_labels = {
    application = var.service_name
    environment = var.environment
    managed_by  = "terraform"
  }

  # Ronda 0 (resilience_enabled = false): sin timeout de adquisición del pool
  # y sin caché de respaldo. Ronda 1 (true): ambos patrones activos.
  runtime_env = merge(
    {
      NODE_ENV                    = "production"
      APP_VERSION                 = var.app_version
      APP_TRACK                   = var.environment
      OTEL_SERVICE_NAME           = local.name_prefix
      OTEL_EXPORTER_OTLP_PROTOCOL = var.otel_exporter_otlp_protocol
      DB_POOL_MAX                 = tostring(var.db_pool_max)
      DB_POOL_ACQUIRE_TIMEOUT_MS  = var.resilience_enabled ? tostring(var.db_pool_acquire_timeout_ms) : "0"
      STALE_CACHE_ENABLED         = var.resilience_enabled ? "true" : "false"
      STALE_CACHE_TTL_SECONDS     = tostring(var.stale_cache_ttl_seconds)
      CHAOS_ENABLED               = var.chaos_enabled ? "true" : "false"
    },
    var.doctors_api_url == "" ? {} : { DOCTORS_API_URL = var.doctors_api_url },
    var.pokemon_api_url == "" ? {} : { POKEMON_API_URL = var.pokemon_api_url },
  )
}
