param(
  [string]$VarFile = "terraform.tfvars"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $VarFile)) {
  throw "No existe $VarFile. Copia terraform.tfvars.example y completa sus valores."
}

terraform destroy -var-file=$VarFile
