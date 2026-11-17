# Isolated Terraform root for the security chaos game day (Exp. 3 + Exp. 4 copy).
# It manages ONLY detection and backup resources. It never touches Cloud Run, Cloud SQL
# or the app CI. State lives in the same bucket under a separate prefix.
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  backend "gcs" {
    bucket = "biblio-express-tfstate-2026-phol"
    prefix = "biblio-express-final-gameday"
  }
}
