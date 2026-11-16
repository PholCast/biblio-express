"""Evalua la metrica objetivo de una ronda contra el umbral declarado.

Lee el umbral del experimento declarativo, el valor medido del resumen de k6
y el veredicto del journal de Chaos Toolkit. Sale con codigo 1 si la metrica
no cumple el umbral, para usarlo como puerta de calidad (chaos gate).
"""

import argparse
import json
import sys
from pathlib import Path

import yaml


def read_field(document, dotted_path):
    value = document
    for key in dotted_path.split("."):
        value = value[key]
    return value


def load_objective(experiment_path):
    experiment = yaml.safe_load(Path(experiment_path).read_text("utf-8"))
    for extension in experiment.get("extensions", []):
        if "objective_metric" in extension:
            return experiment["title"], extension["objective_metric"]
    raise SystemExit("El experimento no declara objective_metric")


def journal_status(journal_path):
    if not journal_path or not Path(journal_path).exists():
        return None, None
    journal = json.loads(Path(journal_path).read_text("utf-8"))
    return journal.get("status"), journal.get("deviated")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--experiment", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--journal")
    parser.add_argument("--out")
    args = parser.parse_args()

    title, objective = load_objective(args.experiment)

    if not Path(args.summary).exists():
        print(
            "No hay resumen de k6: la carga no llego a ejecutarse. Revisa en "
            "el journal si el estado estable se cumplia antes del metodo."
        )
        return 2

    summary = json.loads(Path(args.summary).read_text("utf-8"))

    raw_value = read_field(summary, objective["summary_field"])
    slo = objective.get("slo_success_rate")
    measured = raw_value

    if slo is not None and raw_value is not None:
        measured = round(raw_value / (1 - slo) * 100, 2)

    threshold = objective["threshold_max"]
    within_threshold = measured is not None and measured <= threshold
    status, deviated = journal_status(args.journal)

    result = {
        "experiment": title,
        "round": summary.get("round"),
        "profile": summary.get("profile"),
        "metric": objective["name"],
        "unit": objective.get("unit"),
        "k6_metric": objective["k6_metric"],
        "instrument": objective["instrument"],
        "observation_window_seconds": objective["observation_window_seconds"],
        "slo_success_rate": slo,
        "error_rate": raw_value,
        "threshold_max": threshold,
        "measured": measured,
        "within_threshold": within_threshold,
        "hypothesis": "cumplida" if within_threshold else "refutada",
        "chaostoolkit_status": status,
        "chaostoolkit_deviated": deviated,
        "phases": summary.get("phases"),
    }

    if args.out:
        Path(args.out).write_text(json.dumps(result, indent=2), "utf-8")

    print(json.dumps(result, indent=2))
    print(
        f"\nMetrica objetivo: {measured} (umbral <= {threshold}) -> "
        f"hipotesis {result['hypothesis']}"
    )

    return 0 if within_threshold else 1


if __name__ == "__main__":
    sys.exit(main())
