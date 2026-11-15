locals {
  sql_filter = "resource.type=\"cloudsql_database\""

  # Gráficos XY de Cloud Run para el servicio de la API.
  run_panels = {
    traffic = { title = "Tráfico (req/s)", metric = "run.googleapis.com/request_count", aligner = "ALIGN_RATE", reducer = "REDUCE_SUM", threshold = null }
    p50     = { title = "Latencia p50 (ms)", metric = "run.googleapis.com/request_latencies", aligner = "ALIGN_PERCENTILE_50", reducer = "REDUCE_MAX", threshold = null }
    p95     = { title = "Latencia p95 (ms) - estado estable ${var.p95_threshold_ms} ms", metric = "run.googleapis.com/request_latencies", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = var.p95_threshold_ms }
    cpu     = { title = "CPU contenedor p95", metric = "run.googleapis.com/container/cpu/utilizations", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = null }
    memory  = { title = "Memoria contenedor p95", metric = "run.googleapis.com/container/memory/utilizations", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = null }
    inst    = { title = "Instancias activas", metric = "run.googleapis.com/container/instance_count", aligner = "ALIGN_MAX", reducer = "REDUCE_SUM", threshold = null }
  }

  run_xy = { for key, p in local.run_panels : key => {
    title = p.title
    xyChart = merge({
      dataSets = [{
        legendTemplate  = var.service_name
        plotType        = "LINE"
        timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"${p.metric}\" ${local.run_service}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = p.aligner, crossSeriesReducer = p.reducer } } }
      }]
    }, p.threshold == null ? {} : { thresholds = [{ value = p.threshold }] })
  } }

  # Tasa de 5xx = errores / total (fracción: 0.01 = 1 %).
  error_ratio = {
    title = "Tasa de errores 5xx (fracción) - estado estable ${var.max_5xx_rate}"
    xyChart = {
      thresholds = [{ value = var.max_5xx_rate }]
      dataSets = [{
        legendTemplate = "5xx / total"
        plotType       = "LINE"
        timeSeriesQuery = { timeSeriesFilterRatio = {
          numerator   = { filter = "${local.run_requests} metric.labels.response_code_class=\"5xx\"", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
          denominator = { filter = local.run_requests, aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
        } }
      }]
    }
  }

  class_chart = {
    title = "Respuestas por clase (req/s)"
    xyChart = { dataSets = [{
      legendTemplate  = "$${metric.labels.response_code_class}"
      plotType        = "STACKED_AREA"
      timeSeriesQuery = { timeSeriesFilter = { filter = local.run_requests, aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["metric.label.response_code_class"] } } }
    }] }
  }

  # Métricas basadas en logs: ventana de inyección y patrones de resiliencia.
  chaos_xy = { for key, m in google_logging_metric.chaos : key => {
    title = m.description
    xyChart = { dataSets = [{
      legendTemplate  = m.name
      plotType        = "STACKED_BAR"
      timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"logging.googleapis.com/user/${m.name}\" ${local.run_service}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" } } }
    }] }
  } }

  sql_xy = { for key, p in {
    backends = { title = "Cloud SQL conexiones abiertas (pool retenido = meseta)", metric = "cloudsql.googleapis.com/database/postgresql/num_backends", reducer = "REDUCE_SUM" }
    cpu      = { title = "Cloud SQL CPU", metric = "cloudsql.googleapis.com/database/cpu/utilization", reducer = "REDUCE_MAX" }
    } : key => {
    title = p.title
    xyChart = { dataSets = [{
      legendTemplate  = "postgres"
      plotType        = "LINE"
      timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"${p.metric}\" ${local.sql_filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", crossSeriesReducer = p.reducer } } }
    }] }
  } }

  experiment_text = <<-EOT
    **Experimento: agotamiento del pool de conexiones** (chaos/experiments/pool-exhaustion.yaml)

    - Fallo: 10/10 conexiones del pool retenidas durante 120 s.
    - Métrica objetivo: tasa de error en la ventana de inyección (k6), umbral ≤ 5 %.
    - Ronda 0: sin timeout de adquisición ni caché de respaldo.
    - Ronda 1: timeout de adquisición (1 s) y respuesta degradada desde caché.

    La barra "Ventana de inyección" marca cuándo estuvo activo el fallo; compárala
    con la latencia p95, la tasa de 5xx y las respuestas degradadas de cada ronda.
  EOT

  # Mosaic de 48 columnas: [x, y, ancho, alto, widget].
  tiles = [
    [0, 0, 16, 16, { title = "Experimento y cómo leer el tablero", text = { content = local.experiment_text, format = "MARKDOWN" } }],
    [16, 0, 32, 16, local.chaos_xy.fault_active],
    [0, 16, 24, 16, local.run_xy.p95],
    [24, 16, 24, 16, local.error_ratio],
    [0, 32, 24, 16, local.class_chart],
    [24, 32, 24, 16, local.chaos_xy.degraded_responses],
    [0, 48, 24, 16, local.sql_xy.backends],
    [24, 48, 24, 16, local.chaos_xy.db_unavailable],
    [0, 64, 24, 16, local.run_xy.traffic],
    [24, 64, 24, 16, local.run_xy.p50],
    [0, 80, 24, 16, local.run_xy.cpu],
    [24, 80, 24, 16, local.run_xy.memory],
    [0, 96, 24, 16, local.run_xy.inst],
    [24, 96, 24, 16, local.sql_xy.cpu],
    [0, 112, 24, 16, { title = "Alerta de errores 5xx", alertChart = { name = google_monitoring_alert_policy.errors_5xx.name } }],
    [24, 112, 24, 16, { title = "Alerta de latencia p95", alertChart = { name = google_monitoring_alert_policy.latency_p95.name } }],
  ]
}

resource "google_monitoring_dashboard" "this" {
  project = var.project_id
  dashboard_json = jsonencode({
    displayName = var.dashboard_name
    mosaicLayout = {
      columns = 48
      tiles   = [for t in local.tiles : { xPos = t[0], yPos = t[1], width = t[2], height = t[3], widget = t[4] }]
    }
  })
}
