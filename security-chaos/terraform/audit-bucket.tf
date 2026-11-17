# Exp. 3 Mejora 2: immutable audit log bucket (plan P5). Gated behind a flag because the lock is
# IRREVERSIBLE: once locked, the retention cannot be lowered and the bucket cannot be deleted
# until its logs age out (30 days). It is additive — it does not remove logs from _Default.

resource "google_logging_project_bucket_config" "gd_audit" {
  count          = var.enable_immutable_audit_bucket ? 1 : 0
  project        = var.project_id
  location       = "global"
  bucket_id      = "gd-audit"
  description    = "Bitácora inmutable del game day (retención bloqueada 30 días)."
  retention_days = 30
  locked         = true
}

resource "google_logging_project_sink" "gd_audit" {
  count       = var.enable_immutable_audit_bucket ? 1 : 0
  name        = "gd-audit"
  project     = var.project_id
  destination = "logging.googleapis.com/${google_logging_project_bucket_config.gd_audit[0].id}"

  filter = <<-EOT
    (resource.type="cloud_run_revision" AND resource.labels.service_name="${var.run_service}")
    OR logName:"cloudaudit.googleapis.com"
    OR logName:"logs/gameday-markers"
    OR logName:"logs/gd-ai-assistant"
  EOT

  # Same-project routing to a log bucket uses internal delivery: the writer identity stays empty
  # and no bucketWriter grant is needed. GCP pins this once set, so it matches the created sink.
  unique_writer_identity = true
}
