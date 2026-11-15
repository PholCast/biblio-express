param(
  [string]$TfVarsFile = ".\terraform.tfvars",

  [string]$BackendConfig = ".\backend.hcl"
)

$ErrorActionPreference = "Stop"

foreach ($command in @("gcloud", "terraform", "docker")) {
  if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
    throw "$command CLI is required."
  }
}

foreach ($file in @($TfVarsFile, $BackendConfig)) {
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

$appProject = Get-HclValue $TfVarsFile "project_id"
$stateProject = Get-HclValue $TfVarsFile "state_project_id"
$bucket = Get-HclValue $BackendConfig "bucket"

if ($appProject -eq $stateProject) {
  throw "state_project_id must differ from project_id ($appProject)."
}

$accessToken = gcloud auth application-default print-access-token 2>$null
if (-not $accessToken) {
  throw "Application Default Credentials are not configured. Run gcloud auth application-default login."
}

# El bucket del estado debe pertenecer al proyecto de estado, no al de la app.
$bucketOwner = (gcloud storage buckets describe "gs://$bucket" --raw --format=json |
  ConvertFrom-Json).projectNumber
$stateNumber = gcloud projects describe $stateProject --format="value(projectNumber)"

if ("$bucketOwner" -ne "$stateNumber") {
  throw "Bucket gs://$bucket does not belong to the state project $stateProject."
}

terraform fmt -check -recursive
terraform init -backend=false
terraform validate
Write-Host "GCP Terraform preflight passed. State bucket gs://$bucket lives in $stateProject."
