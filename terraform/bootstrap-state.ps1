param(
  [Parameter(Mandatory = $true)]
  [string]$SubscriptionId,
  [string]$ResourceGroupName = "rg-biblio-tfstate",
  [string]$StorageAccountName = "stbibliotfstate",
  [string]$Location = "Central US",
  [string]$ContainerName = "tfstate"
)

$ErrorActionPreference = "Stop"

az account set --subscription $SubscriptionId
az group create --name $ResourceGroupName --location $Location --output none
az storage account create `
  --name $StorageAccountName `
  --resource-group $ResourceGroupName `
  --location $Location `
  --sku Standard_LRS `
  --allow-blob-public-access false `
  --min-tls-version TLS1_2 `
  --output none
az storage container create `
  --name $ContainerName `
  --account-name $StorageAccountName `
  --auth-mode login `
  --fail-on-exist `
  --output none

Write-Host "Backend creado. No elimines este Resource Group durante terraform destroy."
