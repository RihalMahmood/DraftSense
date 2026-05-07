"""
Phase 3 - XGBoost Model Training Script
Run after extract_features.py has generated data/features.csv.

Requirements:
    - CUDA GPU with 8GB+ VRAM (uses tree_method="gpu_hist" → ~20 min training)
    - CPU fallback: set tree_method="hist" (slower, ~2-4 hours)

Usage:
    python models/xgboost_model.py
    python models/xgboost_model.py --cpu    # force CPU training

Output:
    models/trained/xgboost_v1.pkl           # model bundle with metadata
"""
import os
import json
import argparse
import logging
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

FEATURES_CSV    = Path("data/features.csv")
CHAMPIONS_JSON  = Path("data/champions.json")
OUTPUT_PATH     = Path("models/trained/xgboost_v1.pkl")
CURRENT_PATCH   = os.getenv("CURRENT_PATCH", "14.8")


def train(use_cpu: bool = False) -> None:
    #Load Data
    log.info(f"Loading features from {FEATURES_CSV}...")
    df = pd.read_csv(FEATURES_CSV)
    log.info(f"Dataset: {len(df):,} samples × {df.shape[1]-1} features")

    X = df.drop(columns=["label"]).values.astype(np.float32)
    y = df["label"].values.astype(np.int32)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    log.info(f"Train: {len(X_train):,} | Test: {len(X_test):,}")

    #Train
    #Using 'cuda' device for RTX 3060 Ti acceleration
    device      = "cpu" if use_cpu else "cuda"
    tree_method = "hist"
    log.info(f"Training XGBoost (device={device})...")

    model = xgb.XGBClassifier(
        n_estimators=1000,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=1,
        eval_metric="logloss",
        tree_method=tree_method,
        device=device,
        early_stopping_rounds=50,   #Moved to constructor for XGBoost 2.0+
        random_state=42,
        n_jobs=-1,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=100,
    )

    #Evaluate
    y_pred      = model.predict(X_test)
    y_proba     = model.predict_proba(X_test)[:, 1]
    accuracy    = accuracy_score(y_test, y_pred)
    auc         = roc_auc_score(y_test, y_proba)

    log.info(f"\n{'='*50}")
    log.info(f"Accuracy:  {accuracy:.4f}  ({accuracy*100:.2f}%)")
    log.info(f"AUC-ROC:   {auc:.4f}")
    log.info(f"\n{classification_report(y_test, y_pred, target_names=['loss','win'])}")

    if accuracy < 0.85:
        log.warning("Accuracy < 85% - consider collecting more data or tuning hyperparameters.")
    else:
        log.info("Accuracy target met (> 85%)")

    #Load champion list for bundling
    champion_list = []
    if CHAMPIONS_JSON.exists():
        with open(CHAMPIONS_JSON) as f:
            champion_list = json.load(f)

    #Save model bundle
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model":        model,
        "model_name":   "xgboost_v1",
        "patch":        CURRENT_PATCH,
        "champion_list": champion_list,
        "metadata": {
            "accuracy":         round(accuracy, 4),
            "auc_roc":          round(auc, 4),
            "training_samples": len(X_train),
            "trained_at":       datetime.utcnow().isoformat(),
            "best_iteration":   model.best_iteration,
        },
    }
    joblib.dump(bundle, OUTPUT_PATH)
    log.info(f"Model saved → {OUTPUT_PATH}")
    log.info("Restart FastAPI service to load the new model: uvicorn api.main:app --reload")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train XGBoost draft prediction model")
    parser.add_argument("--cpu", action="store_true", help="Force CPU training (tree_method=hist)")
    args = parser.parse_args()
    train(use_cpu=args.cpu)
