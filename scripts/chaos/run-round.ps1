param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("calibracion", "0", "1")]
  [string]$Round,

  [Parameter(Mandatory = $true)]
  [string]$BaseUrl,

  [string]$FlowPath = "/api/v5/books/1",

  [string]$Experiment = "chaos/experiments/pool-exhaustion.yaml"
)

# Ejecuta una ronda completa con el perfil comun y guarda las evidencias.
#   calibracion: solo carga, sin fallo (mide el estado estable).
#   0 y 1: experimento declarativo con Chaos Toolkit + evaluacion del umbral.
# Requiere k6 y chaostoolkit instalados y la variable CHAOS_TOKEN definida.

$ErrorActionPreference = "Stop"

$label = if ($Round -eq "calibracion") { "calibracion" } else { "ronda-$Round" }
$results = "chaos/results/$label"
New-Item -ItemType Directory -Force $results | Out-Null

$env:BASE_URL = $BaseUrl.TrimEnd("/")
$env:FLOW_PATH = $FlowPath
$env:ROUND = $label
$env:EXPERIMENT = "pool-exhaustion"
$env:SUMMARY_PATH = "$results/k6-summary.json"

# Comprobacion previa: no se inyecta nada si el sistema no esta sano.
foreach ($url in @("$($env:BASE_URL)/health", "$($env:BASE_URL)$FlowPath")) {
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -ne 200) { throw "HTTP $($response.StatusCode)" }
  }
  catch {
    throw "Comprobacion previa fallida: $url no respondio 200 ($($_.Exception.Message))"
  }
}

if ($Round -eq "calibracion") {
  k6 run load/k6/flow.js
  Write-Host "Estado estable medido: fase baseline de $($env:SUMMARY_PATH)"
  exit $LASTEXITCODE
}

if (-not $env:CHAOS_TOKEN) {
  throw "Define la variable de entorno CHAOS_TOKEN antes de ejecutar."
}

chaos run $Experiment `
  --journal-path "$results/journal.json" `
  --hypothesis-strategy continuously `
  --hypothesis-frequency 10 `
  --rollback-strategy always

Write-Host "Chaos Toolkit termino con codigo $LASTEXITCODE"

python chaos/evaluate_objective.py `
  --experiment $Experiment `
  --summary $env:SUMMARY_PATH `
  --journal "$results/journal.json" `
  --out "$results/result.json"

exit $LASTEXITCODE
