locals {
  run_filter = "resource.type=\"cloud_run_revision\""
  lb_filter  = "resource.type=\"https_lb_rule\""
  sql_filter = "resource.type=\"cloudsql_database\""

  tracks = {
    stable = { service = var.stable_service, backend = "${var.stable_service}-backend" }
    canary = { service = var.canary_service, backend = "${var.canary_service}-backend" }
  }

  # Serie de Cloud Run por servicio (una línea por track).
  run_series = { for track, t in local.tracks : track => "${local.run_filter} resource.labels.service_name=\"${t.service}\"" }
  lb_series  = { for track, t in local.tracks : track => "${local.lb_filter} resource.labels.backend_target_name=\"${t.backend}\"" }

  # Gráficos XY de Cloud Run: stable vs canary.
  run_panels = {
    traffic = { title = "Tráfico por servicio (req/s)", metric = "run.googleapis.com/request_count", aligner = "ALIGN_RATE", reducer = "REDUCE_SUM", threshold = null }
    p50     = { title = "Latencia p50 (ms)", metric = "run.googleapis.com/request_latencies", aligner = "ALIGN_PERCENTILE_50", reducer = "REDUCE_MAX", threshold = null }
    p95     = { title = "Latencia p95 (ms) - SLO 500 ms", metric = "run.googleapis.com/request_latencies", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = 500 }
    p99     = { title = "Latencia p99 (ms)", metric = "run.googleapis.com/request_latencies", aligner = "ALIGN_PERCENTILE_99", reducer = "REDUCE_MAX", threshold = null }
    cpu     = { title = "CPU contenedor p95", metric = "run.googleapis.com/container/cpu/utilizations", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = null }
    memory  = { title = "Memoria contenedor p95", metric = "run.googleapis.com/container/memory/utilizations", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = null }
    inst    = { title = "Instancias activas", metric = "run.googleapis.com/container/instance_count", aligner = "ALIGN_MAX", reducer = "REDUCE_SUM", threshold = null }
    startup = { title = "Arranque de contenedores p95 (cold start, ms)", metric = "run.googleapis.com/container/startup_latencies", aligner = "ALIGN_PERCENTILE_95", reducer = "REDUCE_MAX", threshold = null }
  }

  run_xy = { for key, p in local.run_panels : key => {
    title = p.title
    xyChart = merge({
      dataSets = [for track, filter in local.run_series : {
        legendTemplate  = track
        plotType        = "LINE"
        timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"${p.metric}\" ${filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = p.aligner, crossSeriesReducer = p.reducer } } }
      }]
    }, p.threshold == null ? {} : { thresholds = [{ value = p.threshold }] })
  } }

  # Tasa de errores = errores / total por servicio (fracción: 0.01 = 1%).
  error_ratio = { for cls, slo in { "5xx" = 0.01, "4xx" = 0.05 } : cls => {
    title = "Tasa de errores ${cls} (fracción) - SLO ${slo * 100}%"
    xyChart = {
      thresholds = [{ value = slo }]
      dataSets = [for track, filter in local.run_series : {
        legendTemplate = track
        plotType       = "LINE"
        timeSeriesQuery = { timeSeriesFilterRatio = {
          numerator   = { filter = "metric.type=\"run.googleapis.com/request_count\" ${filter} metric.labels.response_code_class=\"${cls}\"", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
          denominator = { filter = "metric.type=\"run.googleapis.com/request_count\" ${filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
        } }
      }]
    }
  } }

