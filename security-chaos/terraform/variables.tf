variable "project_id" {
  type    = string
  default = "biblio-express-final-2026"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "run_service" {
  description = "Cloud Run service whose telemetry Exp. 3 protects."
  type        = string
  default     = "biblio-express-final-api"
}

variable "notification_email" {
  description = "Optional email for alerts. Pub/Sub is the measured channel; email is extra for the demo."
  type        = string
  default     = ""
}

variable "soc_assistant_account_id" {
  description = "Account id of the SOC assistant service account (tendencia: identidad de agentes de IA)."
  type        = string
  default     = "soc-assistant"
}

# Irreversible controls are gated behind these flags so a normal apply never locks anything.
# Both default to true: they are already applied and part of the game day deliverable, so a plain
# `terraform apply` reproduces the full stack. They were gated during the first apply so the lock
# never happened by accident.
variable "enable_immutable_audit_bucket" {
  description = "Exp. 3 mejora 2: locked 30-day audit log bucket. IRREVERSIBLE once applied."
  type        = bool
  default     = true
}

variable "enable_worm_backup_copy" {
  description = "Exp. 4: locked 7-day isolated copy bucket (+ transfer job later). IRREVERSIBLE."
  type        = bool
  default     = true
}

variable "receipts_source_bucket" {
  description = "Daniela's bucket with the flow receipts (source of the isolated copy)."
  type        = string
  default     = "project-39d0c894-3885-4211-89d-gd4-flow-receipts"
}
