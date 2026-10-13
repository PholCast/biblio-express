# Despliegue de Biblio Express con Terraform

Esta carpeta contiene la infraestructura de Biblio Express en Microsoft Azure. Terraform crea los servicios, configura sus permisos y despliega dos aplicaciones Linux en Azure App Service:

- **API**: imagen `biblio-express`, puerto 3000.
- **Object Storage**: imagen `biblio-object-storage`, puerto 3001. Es utilizado por la API para guardar los recursos obtenidos por los endpoints getById de la v3.

El despliegue automatizado se ejecuta mediante [`.github/workflows/terraform.yml`](../.github/workflows/terraform.yml).

## Requisitos

- Una suscripción de Azure y permisos para crear recursos, asignaciones RBAC, secretos y recursos de red.
- Terraform `>= 1.7.0`.
- Azure CLI autenticado (`az login`).
- Docker, si se ejecuta el proceso de construcción y publicación de imágenes localmente.
- Un backend remoto de estado en Azure Storage.

### Crear el backend remoto

El backend debe existir antes de ejecutar `terraform init`. Desde PowerShell, en esta carpeta:

```powershell
.\bootstrap-state.ps1 `
  -SubscriptionId "<SUBSCRIPTION_ID>"
```

El script crea por defecto el grupo `rg-biblio-tfstate`, la cuenta `stbibliotfstate` y el contenedor `tfstate`. Se pueden cambiar mediante `-ResourceGroupName`, `-StorageAccountName`, `-Location` y `-ContainerName`. Este grupo de estado **no debe eliminarse** durante un `terraform destroy`.

## Despliegue mediante GitHub Actions

1. Configure estos secretos del repositorio:

   | Secreto | Uso |
   |---|---|
   | `AZURE_CREDENTIALS` | Credenciales JSON de un service principal para `azure/login`. |
   | `TF_VAR_SUBSCRIPTION_ID` | Identificador de la suscripción de Azure. |
   | `TF_VAR_TENANT_ID` | Identificador del tenant de Microsoft Entra. |
   | `TF_VAR_POSTGRES_ADMIN_PASSWORD` | Contraseña de PostgreSQL (mínimo 12 caracteres, sin espacios). |
   | `TF_VAR_PORTAL_PRINCIPAL_ID` | Object ID opcional para acceso desde el portal. |
   | `TF_STATE_RESOURCE_GROUP` | Grupo del backend remoto. |
   | `TF_STATE_STORAGE_ACCOUNT` | Cuenta de Storage del backend. |
   | `TF_STATE_CONTAINER` | Contenedor del estado. |
   | `TF_STATE_KEY` | Nombre/ruta del archivo de estado, por ejemplo `biblio-express.tfstate`. |

2. Ejecute el workflow **Terraform - Azure App Services**:
   - Un `push` a `main` que afecte `terraform/` o el código de la aplicación inicia el despliegue.
   - `workflow_dispatch` permite elegir:
     - `destroy-and-deploy`: elimina la infraestructura administrada y la crea de nuevo.
     - `deploy-only`: conserva la infraestructura y publica una nueva versión.
     - `destroy`: elimina la infraestructura y no vuelve a desplegarla.

3. El workflow realiza estas etapas:
   1. Autentica Azure y ejecuta `preflight.ps1`.
   2. Inicializa Terraform con el backend remoto.
   3. Ejecuta `terraform fmt -check -recursive` y `terraform validate`.
   4. Crea primero el Resource Group, el Container Registry y el App Service Plan.
   5. Construye y publica en ACR las imágenes de la API y Object Storage con el tag `sha-<commit>`.
   6. Aplica el resto de la infraestructura usando esos tags.
   7. Comprueba `api_url/health` y `object_storage_url/health`.

## Ejecución local

La ejecución local debe hacerse desde una terminal **PowerShell**, ubicada en la raíz del repositorio. El archivo `terraform.tfvars` real está ignorado por Git.

### 1. Preparar Azure y las variables

```powershell
cd C:\ruta\al\repositorio\biblio-express
az login --tenant "<TENANT_ID>"
az account set --subscription "<SUBSCRIPTION_ID>"
az account show --output table

cd terraform
Copy-Item terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars` y reemplace los valores de ejemplo de `subscription_id`, `tenant_id` y `postgres_admin_password`. También puede completar `portal_principal_id` y las URLs de servicios externos. La contraseña debe tener al menos 12 caracteres y no contener espacios.

### 2. Crear o comprobar el backend remoto

Si el backend todavía no existe, créelo una sola vez:

```powershell
.\bootstrap-state.ps1 `
  -SubscriptionId "<SUBSCRIPTION_ID>" `
  -ResourceGroupName "rg-biblio-tfstate" `
  -StorageAccountName "stbibliotfstate" `
  -Location "Central US" `
  -ContainerName "tfstate"
```

Si ya existe, omita este paso. En los comandos siguientes, use exactamente esos mismos valores. El Resource Group del backend es independiente de la infraestructura de la aplicación y no debe eliminarse con `terraform destroy`.

### 3. Validar prerrequisitos e inicializar Terraform

```powershell
.\preflight.ps1 `
  -SubscriptionId "<SUBSCRIPTION_ID>" `
  -TenantId "<TENANT_ID>" `
  -BackendResourceGroup "rg-biblio-tfstate" `
  -BackendStorageAccount "stbibliotfstate" `
  -BackendContainer "tfstate" `
  -BackendKey "biblio-express.tfstate" `
  -RequireDocker

terraform init -input=false `
  -backend-config="resource_group_name=rg-biblio-tfstate" `
  -backend-config="storage_account_name=stbibliotfstate" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=biblio-express.tfstate"

terraform fmt -check -recursive
terraform validate
```

`preflight.ps1` comprueba que Terraform, Azure CLI y Docker estén instalados, que la sesión activa corresponda al tenant y la suscripción indicados, y que el backend sea accesible.

### 4. Crear el registro y publicar las imágenes

El App Service utiliza imágenes privadas de ACR. Por eso, primero se crean el Resource Group, el Container Registry y el App Service Plan, después se construyen y publican las imágenes. Finalmente se aplica el resto de la infraestructura.

```powershell
terraform apply -auto-approve `
  -var-file=terraform.tfvars `
  -target=module.resource_group `
  -target=module.container_registry `
  -target=module.app_service_plan

$tag = "local-$(Get-Date -Format 'yyyyMMddHHmmss')"
$acr = terraform output -raw container_registry_login_server
$acrName = ($acr -split '\.')[0]

az acr login --name $acrName

cd ..
docker build -t "$acr/biblio-express:$tag" .
docker push "$acr/biblio-express:$tag"

docker build -t "$acr/biblio-object-storage:$tag" .\object-storage
docker push "$acr/biblio-object-storage:$tag"

cd terraform
```

El `tag` debe ser el mismo para ambas imágenes y no debe contener espacios. El `-target` se usa únicamente para habilitar el registro antes de publicar las imágenes. El siguiente `apply` completa la infraestructura.

### 5. Desplegar y comprobar la aplicación

```powershell
terraform plan `
  -var-file=terraform.tfvars `
  -var="api_image_tag=$tag" `
  -var="object_storage_image_tag=$tag"

terraform apply -auto-approve `
  -var-file=terraform.tfvars `
  -var="api_image_tag=$tag" `
  -var="object_storage_image_tag=$tag"

$apiUrl = terraform output -raw api_url
$storageUrl = terraform output -raw object_storage_url

curl.exe --fail --retry 12 --retry-delay 10 "$apiUrl/health"
curl.exe --fail --retry 12 --retry-delay 10 "$storageUrl/health"
```

El primer `apply` puede tardar varios minutos mientras Azure crea PostgreSQL, Key Vault y los App Services. Las salidas `api_url` y `object_storage_url` muestran las URLs públicas resultantes.

### Eliminar la infraestructura

Para eliminar la infraestructura administrada por Terraform:

```powershell
.\destroy.ps1 -VarFile ".\terraform.tfvars"
```

El backend remoto queda fuera de ese `destroy`.

## Módulos y recursos

Los módulos reutilizables están en `modules/`. Cada uno usa `main.tf` para recursos, `variables.tf` para entradas y `outputs.tf` para valores que consumen otros módulos:

| Módulo | Función |
|---|---|
| `resource-group` | Crea el Resource Group y centraliza ubicación y tags. |
| `app-service-plan` | Crea el plan Linux de App Service (SKU F1). |
| `container-registry` | Crea un Azure Container Registry Basic para las dos imágenes. |
| `app-service` | Crea un Linux Web App con identidad administrada, HTTPS, configuración Docker y endpoint `/health`. se instancia para la API y Object Storage. |
| `postgresql` | Crea PostgreSQL Flexible Server 16, la base de datos `bibliodb`, backups de 7 días y la regla para servicios de Azure. |
| `storage-account` | Crea la cuenta de Storage privada para artefactos. |
| `blob-container` | Crea el contenedor privado `flow-artifacts`. |
| `key-vault` | Crea Key Vault con RBAC y almacena el `DATABASE_URL` como secreto. |
| `managed-identity` | Crea la identidad administrada asignada a las aplicaciones. |
| `role-assignments` | Otorga `AcrPull`, `Storage Blob Data Contributor` y `Key Vault Secrets User`. opcionalmente habilita esos accesos al usuario del portal. |

La configuración raíz (`*.tf`) conecta estos módulos, define nombres y tags comunes, inyecta las variables de aplicación y expone las salidas `api_url`, `object_storage_url`, `container_registry_login_server`, `postgresql_fqdn` y nombres de recursos.

## Archivos y scripts

- **`.tf`**: configuración declarativa de Terraform.
  - `providers.tf`, `versions.tf`: proveedor AzureRM/Random y versiones requeridas.
  - `backend.tf`: backend remoto `azurerm`.
  - `variables.tf`, `locals.tf`, `outputs.tf`: entradas, valores derivados y salidas.
  - Archivos restantes: composición de cada módulo y configuración de la API, PostgreSQL, Storage, Key Vault, ACR e identidades.
- **`.tfvars.example`**: plantilla de variables. no contiene valores reales.
- **`.terraform.lock.hcl`**: fija las versiones y hashes de los proveedores.
- **`.ps1`**:
  - `bootstrap-state.ps1`: crea el almacenamiento remoto inicial.
  - `preflight.ps1`: verifica Terraform, Azure CLI, sesión, suscripción, tenant, backend y opcionalmente Docker.
  - `destroy.ps1`: ejecuta `terraform destroy` usando un archivo de variables.
- **`.gitignore`**: excluye estado local, `.terraform/`, planes y archivos `.tfvars` reales.

