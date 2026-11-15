param(
  [Parameter(Mandatory = $true)]
  [string]$AppProjectId,

  [Parameter(Mandatory = $true)]
  [string]$StateProjectId,

  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [string]$Location = "us-central1",

  [string]$StatePrefix = "biblio-express-final",

  # Solo si el proyecto de estado todavia no existe y hay que crearlo.
  [string]$BillingAccountId = "",

  # Cuenta de servicio del pipeline (salida github_deployer_service_account).
  # Se puede volver a ejecutar el script con este valor tras el primer apply.
  [string]$DeployerServiceAccount = ""
)

# Crea el bucket del tfstate en un proyecto DISTINTO al de la aplicacion.
# Asi "terraform destroy" puede eliminar toda la infraestructura (incluso el
# proyecto de la aplicacion) sin borrar ni dejar inaccesible su propio estado.

$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud CLI is required."
}

if ($AppProjectId -eq $StateProjectId) {
  throw "StateProjectId must differ from AppProjectId: the tfstate cannot live inside the application project."
}

function Test-Gcloud {
  param([string[]]$Arguments)

  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & gcloud @Arguments *> $null
  $ErrorActionPreference = $previous

  return $LASTEXITCODE -eq 0
}

if (-not (Test-Gcloud @("projects", "describe", $StateProjectId))) {
  Write-Host "Creating state project $StateProjectId"
  gcloud projects create $StateProjectId --name "Biblio Express TF State"

  if ($BillingAccountId -ne "") {
    gcloud billing projects link $StateProjectId --billing-account $BillingAccountId
  }
  else {
    Write-Warning "No BillingAccountId given: link billing to $StateProjectId before creating the bucket."
  }
}

gcloud services enable storage.googleapis.com --project $StateProjectId

if (-not (Test-Gcloud @("storage", "buckets", "describe", "gs://$BucketName"))) {
  gcloud storage buckets create "gs://$BucketName" `
    --project $StateProjectId `
    --location $Location `
    --uniform-bucket-level-access `
    --public-access-prevention
}

gcloud storage buckets update "gs://$BucketName" --versioning

if ($DeployerServiceAccount -ne "") {
  gcloud storage buckets add-iam-policy-binding "gs://$BucketName" `
    --member "serviceAccount:$DeployerServiceAccount" `
    --role "roles/storage.objectAdmin"
}

$backend = @"
bucket = "$BucketName"
prefix = "$StatePrefix"
"@

Set-Content -Path (Join-Path $PSScriptRoot "backend.hcl") -Value $backend

Write-Host "Terraform state bucket ready: gs://$BucketName (project $StateProjectId)"
Write-Host "Next: terraform init -backend-config=backend.hcl"
