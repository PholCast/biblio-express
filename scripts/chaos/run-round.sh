#!/usr/bin/env bash
# Ejecuta una ronda completa con el perfil comun y guarda las evidencias.
#   calibracion: solo carga, sin fallo (mide el estado estable).
#   0 y 1: experimento declarativo con Chaos Toolkit + evaluacion del umbral.
#
# Uso: BASE_URL=https://... CHAOS_TOKEN=... scripts/chaos/run-round.sh <ronda>
set -uo pipefail

# En Git Bash para Windows evita que /api/... se convierta en una ruta C:\.
export MSYS2_ENV_CONV_EXCL="FLOW_PATH"

ROUND_ARG="${1:?Uso: run-round.sh <calibracion|0|1>}"
EXPERIMENT_FILE="${EXPERIMENT_FILE:-chaos/experiments/pool-exhaustion.yaml}"

case "$ROUND_ARG" in
  calibracion) LABEL="calibracion" ;;
  0 | 1) LABEL="ronda-$ROUND_ARG" ;;
  *) echo "Ronda invalida: $ROUND_ARG" >&2; exit 2 ;;
esac

: "${BASE_URL:?Define BASE_URL con la URL de la API}"

RESULTS="chaos/results/$LABEL"
mkdir -p "$RESULTS"

export BASE_URL="${BASE_URL%/}"
export FLOW_PATH="${FLOW_PATH:-/api/v5/books/1}"
export ROUND="$LABEL"
export EXPERIMENT="pool-exhaustion"
export SUMMARY_PATH="$RESULTS/k6-summary.json"

# Comprobacion previa: no se inyecta nada si el sistema no esta sano.
preflight() {
  local code
  code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$1" || true)
  if [ "$code" != "200" ]; then
    echo "Comprobacion previa fallida: $1 respondio $code" >&2
    exit 2
  fi
}

preflight "$BASE_URL/health"
preflight "$BASE_URL$FLOW_PATH"

if [ "$LABEL" = "calibracion" ]; then
  k6 run load/k6/flow.js
  status=$?
  echo "Estado estable medido: fase baseline de $SUMMARY_PATH"
  exit "$status"
fi

: "${CHAOS_TOKEN:?Define CHAOS_TOKEN con el token del interruptor}"

# Limite de 15 minutos: una ronda dura 5 min 30 s.
LIMIT=""
if command -v timeout >/dev/null 2>&1; then
  LIMIT="timeout 900"
fi

$LIMIT chaos run "$EXPERIMENT_FILE" \
  --journal-path "$RESULTS/journal.json" \
  --hypothesis-strategy continuously \
  --hypothesis-frequency 10 \
  --rollback-strategy always
echo "Chaos Toolkit termino con codigo $?"

python chaos/evaluate_objective.py \
  --experiment "$EXPERIMENT_FILE" \
  --summary "$SUMMARY_PATH" \
  --journal "$RESULTS/journal.json" \
  --out "$RESULTS/result.json"
