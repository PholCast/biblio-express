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
}
