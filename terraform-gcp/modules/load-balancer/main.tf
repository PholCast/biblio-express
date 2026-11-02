resource "google_compute_global_address" "this" {
  project = var.project_id
  name    = "${var.name}-ip"
}

resource "google_compute_region_network_endpoint_group" "stable" {
  project               = var.project_id
  name                  = "${var.name}-stable-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.stable_service_name
  }
}

resource "google_compute_region_network_endpoint_group" "canary" {
  project               = var.project_id
  name                  = "${var.name}-canary-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.canary_service_name
  }
}

resource "google_compute_backend_service" "stable" {
  project               = var.project_id
  name                  = "${var.name}-stable-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.stable.id
  }
}

resource "google_compute_backend_service" "canary" {
  project               = var.project_id
  name                  = "${var.name}-canary-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.canary.id
  }
}

resource "google_compute_url_map" "this" {
  project = var.project_id
  name    = "${var.name}-url-map"

  default_route_action {
    weighted_backend_services {
      backend_service = google_compute_backend_service.stable.id
      weight          = var.stable_traffic_percent
    }

    weighted_backend_services {
      backend_service = google_compute_backend_service.canary.id
      weight          = var.canary_traffic_percent
    }
  }
}

resource "google_compute_target_http_proxy" "this" {
  project = var.project_id
  name    = "${var.name}-http-proxy"
  url_map = google_compute_url_map.this.id
}

resource "google_compute_global_forwarding_rule" "this" {
  project               = var.project_id
  name                  = "${var.name}-forwarding-rule"
  target                = google_compute_target_http_proxy.this.id
  ip_address            = google_compute_global_address.this.id
  port_range            = "80"
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
