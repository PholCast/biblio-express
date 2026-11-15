param(
  [string]$VarFile = ".\terraform.tfvars",

  [string]$BackendConfig = ".\backend.hcl"
)

# Destruye la infraestructura de la aplicacion. Antes comprueba que el tfstate
# NO este dentro del proyecto que se va a destruir: si lo estuviera, el destroy
# borraria su propio estado a mitad de camino.

$ErrorActionPreference = "Stop"

foreach ($file in @($VarFile, $BackendConfig)) {
  if (-not (Test-Path $file)) {
    throw "Required file not found: $file"
  }
}

function Get-HclValue {
  param([string]$File, [string]$Name)

  $match = Select-String -Path $File -Pattern "^\s*$Name\s*=\s*`"([^`"]+)`"" |
    Select-Object -First 1

  if (-not $match) {
    throw "$Name is not defined in $File"
  }

  return $match.Matches[0].Groups[1].Value
}

$appProject = Get-HclValue $VarFile "project_id"
$bucket = Get-HclValue $BackendConfig "bucket"

$bucketOwner = (gcloud storage buckets describe "gs://$bucket" --raw --format=json |
  ConvertFrom-Json).projectNumber
$appNumber = gcloud projects describe $appProject --format="value(projectNumber)"

if (-not $bucketOwner) {
  throw "Could not read the owner of gs://$bucket. Aborting the destroy."
}

if ("$bucketOwner" -eq "$appNumber") {
  throw "The tfstate bucket gs://$bucket lives inside $appProject. Move the state to another project before destroying."
}

Write-Host "State bucket gs://$bucket is outside $appProject. Destroying..."

terraform init -input=false -reconfigure "-backend-config=$BackendConfig"
terraform destroy "-var-file=$VarFile"

Write-Host "Done. The (now empty) state is still stored in gs://$bucket."
