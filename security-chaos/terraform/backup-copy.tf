# Exp. 4: isolated immutable copy of the flow receipts (plan P7). Gated behind a flag because the
# retention lock is IRREVERSIBLE. The transfer JOB is added later (needs Daniela's source grant).

data "google_storage_transfer_project_service_account" "sts" {
  count   = var.enable_worm_backup_copy ? 1 : 0
  project = var.project_id
}

resource "google_storage_bucket" "gd4_copy" {
  count                       = var.enable_worm_backup_copy ? 1 : 0
  name                        = "biblio-express-final-2026-gd4-copia-aislada"
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false

  # WORM: objects cannot be deleted or overwritten for 7 days, and the policy cannot be removed.
  retention_policy {
    retention_period = 604800
    is_locked        = true
  }
}

# Storage Transfer writes the copies into the destination bucket.
resource "google_storage_bucket_iam_member" "sts_writer" {
  count  = var.enable_worm_backup_copy ? 1 : 0
  bucket = google_storage_bucket.gd4_copy[0].name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${data.google_storage_transfer_project_service_account.sts[0].email}"
}

variable "daniela_account" {
  description = "Daniela's account, granted read on the copy so she can restore in R1."
  type        = string
  default     = ""
}

resource "google_storage_bucket_iam_member" "daniela_reader" {
  count  = var.enable_worm_backup_copy && var.daniela_account != "" ? 1 : 0
  bucket = google_storage_bucket.gd4_copy[0].name
  role   = "roles/storage.objectViewer"
  member = "user:${var.daniela_account}"
}

output "transfer_agent_email" {
  value = var.enable_worm_backup_copy ? data.google_storage_transfer_project_service_account.sts[0].email : ""
}

# On-demand job (no schedule): the operator triggers it with `gcloud transfer jobs run` in step 2
# of the Exp. 4 sequence. A schedule would copy the 10 late receipts and distort the RPO.
resource "google_storage_transfer_job" "receipts_copy" {
  count       = var.enable_worm_backup_copy ? 1 : 0
  project     = var.project_id
  description = "Exp. 4: copy flow receipts to the isolated WORM bucket (never overwrite or delete)"

  transfer_spec {
    gcs_data_source {
      bucket_name = var.receipts_source_bucket
      path        = "receipts/"
    }
    gcs_data_sink {
      bucket_name = google_storage_bucket.gd4_copy[0].name
      path        = "receipts/"
    }
    transfer_options {
      overwrite_when                            = "NEVER"
      delete_objects_from_source_after_transfer = false
      delete_objects_unique_in_sink             = false
    }
  }

  depends_on = [google_storage_bucket_iam_member.sts_writer, google_storage_bucket_iam_member.sts_bucket_writer]
}

output "receipts_copy_job" {
  value = var.enable_worm_backup_copy ? google_storage_transfer_job.receipts_copy[0].name : ""
}

# The transfer agent must also read bucket metadata (storage.buckets.get) on the destination.
resource "google_storage_bucket_iam_member" "sts_bucket_writer" {
  count  = var.enable_worm_backup_copy ? 1 : 0
  bucket = google_storage_bucket.gd4_copy[0].name
  role   = "roles/storage.legacyBucketWriter"
  member = "serviceAccount:${data.google_storage_transfer_project_service_account.sts[0].email}"
}
