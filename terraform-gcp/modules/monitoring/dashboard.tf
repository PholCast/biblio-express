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

  # Respuestas por clase de código (una serie por track y clase).
  class_chart = { for source, cfg in {
    run = { title = "Respuestas por clase (Cloud Run, req/s)", metric = "run.googleapis.com/request_count", series = local.run_series }
    lb  = { title = "Respuestas por clase (Load Balancer, req/s)", metric = "loadbalancing.googleapis.com/https/request_count", series = local.lb_series }
    } : source => {
    title = cfg.title
    xyChart = { dataSets = [for track, filter in cfg.series : {
      legendTemplate  = "${track} $${metric.labels.response_code_class}"
      plotType        = "LINE"
      timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"${cfg.metric}\" ${filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM", groupByFields = ["metric.label.response_code_class"] } } }
    }] }
  } }

  lb_request = "metric.type=\"loadbalancing.googleapis.com/https/request_count\""
  lb_public  = "resource.labels.matched_url_path_rule=\"UNMATCHED\""
  lb_header  = "resource.labels.matched_url_path_rule=\"/\""

  canary_scorecards = {
    errors = {
      title = "Canary 5xx (fracción) - SLO ≤ 0.01"
      scorecard = {
        thresholds     = [{ value = 0.01, color = "RED", direction = "ABOVE" }]
        sparkChartView = { sparkChartType = "SPARK_LINE" }
        timeSeriesQuery = { timeSeriesFilterRatio = {
          numerator   = { filter = "metric.type=\"run.googleapis.com/request_count\" ${local.run_series.canary} metric.labels.response_code_class=\"5xx\"", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
          denominator = { filter = "metric.type=\"run.googleapis.com/request_count\" ${local.run_series.canary}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } }
        } }
      }
    }
    latency = {
      title = "Canary latencia p95 (ms) - SLO ≤ 500"
      scorecard = {
        thresholds      = [{ value = 500, color = "RED", direction = "ABOVE" }]
        sparkChartView  = { sparkChartType = "SPARK_LINE" }
        timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"run.googleapis.com/request_latencies\" ${local.run_series.canary}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_PERCENTILE_95", crossSeriesReducer = "REDUCE_MAX" } } }
      }
    }
  }

  slo_text = <<-EOT
    **Quality gate (observability/canary-slo.json)** - ventana 120 s, ≥ 100 peticiones por track bajo carga concurrente.

    | Decisión | Condición |
    |---|---|
    | promote | canary 5xx ≤ 1%, 4xx ≤ 5%, p95 ≤ 500 ms y p95 ≤ stable + 20% |
    | pause | volumen insuficiente o baseline stable no saludable (reintenta hasta 3 veces) |
    | abort | canary viola 5xx, 4xx o p95 → rollback a 100% stable / 0% canary |

    Etapas: 0 (0% público, x-canary: true) → 1 (10%) → 2 (25%) → 3 (100%).
    Negocio en GCP: préstamos creados y consultas de libro (métricas basadas en logs).
    Libros disponibles (biblio.books.available, OTel) en Grafana Cloud.
  EOT

  # Métricas de negocio basadas en logs, stable vs canary.
  business_xy = { for key, m in google_logging_metric.business : key => {
    title = m.description
    xyChart = { dataSets = [for track, filter in local.run_series : {
      legendTemplate  = track
      plotType        = "STACKED_BAR"
      timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"logging.googleapis.com/user/${m.name}\" ${filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_DELTA", crossSeriesReducer = "REDUCE_SUM" } } }
    }] }
  } }

