param(
  [string]$VarFile = ".\terraform.tfvars"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VarFile)) {
  throw "Terraform variables file not found: $VarFile"
}

terraform destroy -var-file=$VarFile
