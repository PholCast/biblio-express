param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,
  [Parameter(Mandatory = $true)]
  [string]$TenantId,
  [Parameter(Mandatory = $true)]
  [string]$BackendResourceGroup,
  [Parameter(Mandatory = $true)]
  [string]$BackendStorageAccount,
  [Parameter(Mandatory = $true)]
  [string]$BackendContainer,
  [Parameter(Mandatory = $true)]
  [string]$BackendKey,
  [switch]$RequireDocker
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "No se encontró '$Name' en PATH."
  }
}

Assert-Command "terraform"
Assert-Command "az"
if ($RequireDocker) {
  Assert-Command "docker"
}

$terraformVersion = terraform version -json | ConvertFrom-Json
$terraformMajor = [int]$terraformVersion.terraform_version.Split(".")[0]
if ($terraformMajor -lt 1) {
  throw "Terraform debe ser versión 1.x o superior."
}

$account = az account show --output json | ConvertFrom-Json
if ($account.id -ne $SubscriptionId) {
  throw "La suscripción activa ($($account.id)) no coincide con SubscriptionId."
}
if ($account.tenantId -ne $TenantId) {
  throw "El tenant activo ($($account.tenantId)) no coincide con TenantId."
}

$backendValues = @{
  ResourceGroup = $BackendResourceGroup
  StorageAccount = $BackendStorageAccount
  Container = $BackendContainer
  Key = $BackendKey
}
foreach ($entry in $backendValues.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($entry.Value)) {
    throw "El valor del backend '$($entry.Key)' no puede estar vacío."
  }
}

az storage account show `
  --name $BackendStorageAccount `
  --resource-group $BackendResourceGroup `
  --output none

az storage container show `
  --name $BackendContainer `
  --account-name $BackendStorageAccount `
  --auth-mode login `
  --output none

Write-Host "Preflight correcto: Terraform, Azure CLI, sesión de Azure y backend están disponibles."
if ($RequireDocker) {
  Write-Host "Docker también está disponible."
}
