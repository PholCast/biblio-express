locals {
  run_request_logs = "resource.type=\"cloud_run_revision\" AND log_name=\"projects/${var.project_id}/logs/run.googleapis.com%2Frequests\" AND resource.labels.service_name=(\"${var.stable_service}\" OR \"${var.canary_service}\")"

  business_metrics = {
    loans_created = {
      name        = "biblio_loans_created"
      description = "Préstamos creados (POST /api/*/loans con 201) por servicio stable/canary."
      filter      = "${local.run_request_logs} AND httpRequest.requestMethod=\"POST\" AND httpRequest.status=201 AND httpRequest.requestUrl=~\"/api(/v[0-9]+)?/loans/?([?].*)?$\""
    }
    book_lookups = {
      name        = "biblio_book_lookups"
      description = "Consultas de detalle de libro (GET /api/*/books/{id} con 200); en v4 incluyen la disponibilidad."
      filter      = "${local.run_request_logs} AND httpRequest.requestMethod=\"GET\" AND httpRequest.status=200 AND httpRequest.requestUrl=~\"/api(/v[0-9]+)?/books/[0-9]+/?([?].*)?$\""
    }
  }
}

resource "google_logging_metric" "business" {
  for_each = local.business_metrics

  project     = var.project_id
  name        = each.value.name
  description = each.value.description
  filter      = each.value.filter

  metric_descriptor {
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
    display_name = each.value.name
  }
}
