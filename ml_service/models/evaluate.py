"""
Model Evaluation Script
Run after training to validate accuracy and generate a report before deploying.

Usage:
    python models/evaluate.py
    python models/evaluate.py --model models/trained/xgboost_v2.pkl

Target metrics:
    Accuracy: > 85%
    AUC-ROC:  > 0.85
"""
import argparse
import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

FEATURES_CSV = Path("data/features.csv")
DEFAULT_MODEL = Path("models/trained/xgboost_v1.pkl")

ACCURACY_THRESHOLD = 0.85
AUC_THRESHOLD      = 0.85


def evaluate(model_path: Path = DEFAULT_MODEL) -> dict:
    log.info(f"Loading model from {model_path}...")
    bundle = joblib.load(model_path)
    model  = bundle["model"] if isinstance(bundle, dict) else bundle
    meta   = bundle.get("metadata", {}) if isinstance(bundle, dict) else {}
    patch  = bundle.get("patch") if isinstance(bundle, dict) else None

    log.info(f"Model: {bundle.get('model_name', model_path.stem)} | Patch: {patch}")

    log.info(f"Loading features from {FEATURES_CSV}...")
    df = pd.read_csv(FEATURES_CSV)
    X  = df.drop(columns=["label"]).values.astype(np.float32)
    y  = df["label"].values.astype(np.int32)

    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    log.info(f"Test set: {len(X_test):,} samples")

    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    auc      = roc_auc_score(y_test, y_proba)
    cm       = confusion_matrix(y_test, y_pred)

    log.info(f"\n{'='*55}")
    log.info(f"  Accuracy:  {accuracy:.4f}  ({accuracy*100:.2f}%)")
    log.info(f"  AUC-ROC:   {auc:.4f}")
    log.info(f"\n  Confusion Matrix:")
    log.info(f"    TN={cm[0,0]:,}  FP={cm[0,1]:,}")
    log.info(f"    FN={cm[1,0]:,}  TP={cm[1,1]:,}")
    log.info(f"\n{classification_report(y_test, y_pred, target_names=['loss','win'])}")

    #Pass/fail gating
    passed = True
    if accuracy < ACCURACY_THRESHOLD:
        log.error(f"Accuracy {accuracy:.4f} < threshold {ACCURACY_THRESHOLD}")
        passed = False
    else:
        log.info(f"Accuracy threshold passed ({accuracy:.4f} >= {ACCURACY_THRESHOLD})")

    if auc < AUC_THRESHOLD:
        log.error(f"AUC-ROC {auc:.4f} < threshold {AUC_THRESHOLD}")
        passed = False
    else:
        log.info(f"AUC-ROC threshold passed ({auc:.4f} >= {AUC_THRESHOLD})")

    if passed:
        log.info("Model is ready for deployment.")
    else:
        log.warning("Model did not meet thresholds - do not deploy.")

    return {
        "accuracy": round(accuracy, 4),
        "auc_roc":  round(auc, 4),
        "passed":   passed,
        "patch":    patch,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate a trained DraftSense model")
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL, help="Path to .pkl model bundle")
    args = parser.parse_args()
    evaluate(args.model)
