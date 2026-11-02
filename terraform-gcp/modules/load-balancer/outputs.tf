output "ip_address" {
  value = google_compute_global_address.this.address
}

output "url_map_name" {
  value = google_compute_url_map.this.name
}

output "stable_backend_service" {
  value = google_compute_backend_service.stable.name
}

output "canary_backend_service" {
  value = google_compute_backend_service.canary.name
}
