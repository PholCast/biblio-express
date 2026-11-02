param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [string]$Location = "us-central1"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud CLI is required."
}

gcloud auth application-default login
gcloud storage buckets create "gs://$BucketName" --project $ProjectId --location $Location --uniform-bucket-level-access
gcloud storage buckets update "gs://$BucketName" --versioning
Write-Host "Terraform state bucket ready: gs://$BucketName"
