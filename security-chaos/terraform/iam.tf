# Tendencia del sector: identidad de agentes de IA y privilegios de máquina gestionados (plan P5).
# The SOC assistant gets its OWN least-privilege identity instead of running as a person. Phol
# impersonates it for ephemeral tokens (no static keys).

variable "assistant_operator" {
  description = "Human account that impersonates the SOC assistant (ephemeral tokens)."
  type        = string
  default     = "pholcast.dev@gmail.com"
}

resource "google_service_account" "soc_assistant" {
  project      = var.project_id
  account_id   = var.soc_assistant_account_id
  display_name = "SOC assistant (game day Exp. 3)"
  description  = "Least-privilege identity for the AI SOC assistant. Read-only plus log writer."
}

# Read-only on telemetry, plus the ability to write its own gd-ai-assistant audit events.
resource "google_project_iam_member" "soc_assistant_roles" {
  for_each = toset([
    "roles/aiplatform.user",
    "roles/logging.viewer",
    "roles/monitoring.viewer",
    "roles/logging.logWriter",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.soc_assistant.email}"
}

# Phol can mint short-lived tokens for the assistant; the assistant holds no key.
resource "google_service_account_iam_member" "operator_impersonation" {
  service_account_id = google_service_account.soc_assistant.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "user:${var.assistant_operator}"
}

output "soc_assistant_email" {
  value = google_service_account.soc_assistant.email
}
