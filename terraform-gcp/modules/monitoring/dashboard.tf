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

  # Mosaic de 48 columnas: [x, y, ancho, alto, widget].
  tiles = [
    [0, 0, 16, 16, { title = "SLO y decisiones del quality gate", text = { content = local.slo_text, format = "MARKDOWN" } }],
    [16, 0, 8, 8, local.canary_scorecards.errors],
    [24, 0, 8, 8, local.canary_scorecards.latency],
    [16, 8, 16, 8, { title = "Alerta de errores 5xx del canary", alertChart = { name = google_monitoring_alert_policy.canary_5xx.name } }],
    [32, 0, 16, 8, { title = "Alerta de latencia del canary", alertChart = { name = google_monitoring_alert_policy.canary_latency.name } }],
    [32, 8, 16, 8, { title = "Pruebas internas x-canary (req/s, Load Balancer)", xyChart = { dataSets = [{ legendTemplate = "canary x-canary", plotType = "STACKED_BAR", timeSeriesQuery = { timeSeriesFilter = { filter = "${local.lb_request} ${local.lb_filter} ${local.lb_header}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } } } }] } }],

    [0, 16, 16, 16, local.run_xy.traffic],
    [16, 16, 16, 16, { title = "Reparto PÚBLICO stable vs canary (Load Balancer, sin x-canary)", xyChart = { dataSets = [for track, filter in local.lb_series : { legendTemplate = track, plotType = "STACKED_AREA", timeSeriesQuery = { timeSeriesFilter = { filter = "${local.lb_request} ${filter} ${local.lb_public}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_RATE", crossSeriesReducer = "REDUCE_SUM" } } } }] } }],
    [32, 16, 16, 16, local.class_chart.lb],

    [0, 32, 16, 16, local.error_ratio["5xx"]],
    [16, 32, 16, 16, local.error_ratio["4xx"]],
    [32, 32, 16, 16, local.class_chart.run],

    [0, 48, 12, 16, local.run_xy.p50],
    [12, 48, 12, 16, local.run_xy.p95],
    [24, 48, 12, 16, local.run_xy.p99],
    [36, 48, 12, 16, { title = "Latencia p95 extremo a extremo (Load Balancer, ms)", xyChart = { thresholds = [{ value = 500 }], dataSets = [for track, filter in local.lb_series : { legendTemplate = track, plotType = "LINE", timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"loadbalancing.googleapis.com/https/total_latencies\" ${filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_PERCENTILE_95", crossSeriesReducer = "REDUCE_MAX" } } } }] } }],

    [0, 64, 12, 16, local.run_xy.cpu],
    [12, 64, 12, 16, local.run_xy.memory],
    [24, 64, 12, 16, local.run_xy.inst],
    [36, 64, 12, 16, local.run_xy.startup],

    [0, 80, 24, 16, { title = "Cloud SQL CPU (BD compartida)", xyChart = { dataSets = [{ legendTemplate = "postgres", plotType = "LINE", timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" ${local.sql_filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", crossSeriesReducer = "REDUCE_MAX" } } } }] } }],
    [24, 80, 24, 16, { title = "Cloud SQL conexiones activas", xyChart = { dataSets = [{ legendTemplate = "postgres", plotType = "LINE", timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\" ${local.sql_filter}", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MEAN", crossSeriesReducer = "REDUCE_SUM" } } } }] } }],

    [0, 96, 24, 16, local.business_xy.loans_created],
    [24, 96, 24, 16, local.business_xy.book_lookups],

    [0, 112, 48, 16, { title = "Peso configurado del canary (%) - URL map", xyChart = {
      yAxis = { label = "% tráfico configurado", scale = "LINEAR" }
      dataSets = [{
        legendTemplate  = "$${metric.labels.track}"
        plotType        = "LINE"
        timeSeriesQuery = { timeSeriesFilter = { filter = "metric.type=\"${google_monitoring_metric_descriptor.canary_traffic_weight.type}\" resource.type=\"global\"", aggregation = { alignmentPeriod = "60s", perSeriesAligner = "ALIGN_MAX", crossSeriesReducer = "REDUCE_MAX", groupByFields = ["metric.label.track"] } } }
      }]
    } }],
  ]
}

# Peso configurado en el URL map por track; lo publica scripts/run-canary-stages.sh.
resource "google_monitoring_metric_descriptor" "canary_traffic_weight" {
  project      = var.project_id
  type         = "custom.googleapis.com/biblio/canary_traffic_weight"
  metric_kind  = "GAUGE"
  value_type   = "DOUBLE"
  unit         = "%"
  display_name = "Canary configured traffic weight"
  description  = "Porcentaje de tráfico público configurado en el URL map para cada track."

  labels {
    key         = "track"
    value_type  = "STRING"
    description = "stable o canary"
  }
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
