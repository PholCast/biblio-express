param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$BillingAccountId,

  [string]$TfVarsFile = ".\terraform.tfvars"
)

$ErrorActionPreference = "Stop"

foreach ($command in @("gcloud", "terraform", "docker")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command CLI is required."
  }
}

if (-not (Test-Path $TfVarsFile)) {
  throw "Terraform variables file not found: $TfVarsFile"
}

$activeAccount = gcloud auth application-default print-access-token 2>$null
if (-not $activeAccount) {
  throw "Application Default Credentials are not configured. Run gcloud auth application-default login."
}

$project = gcloud projects describe $ProjectId --format="value(projectId)" 2>$null
if (-not $project) {
  Write-Warning "Project $ProjectId is not visible yet; Terraform may create it."
}

if ($BillingAccountId -eq "000000-000000-000000") {
  throw "Replace the example billing account ID before creating a project."
}

terraform fmt -check -recursive
terraform init -backend=false
terraform validate
Write-Host "GCP Terraform preflight passed."
