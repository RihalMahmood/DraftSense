"""
Phase 0 - Feature Extraction Script
Converts raw match documents from MongoDB into a feature matrix CSV
ready for XGBoost / PyTorch training.

Each match generates 10 training samples (one per participant).
500K matches → ~5,000,000 training samples.

Feature vector layout (per sample):
  enemy_picks_onehot  [n_champs × 5 roles]  = 825 features
  ally_picks_onehot   [n_champs × 4 roles]  = 660 features  (excl. own role)
  bans_onehot         [n_champs]             = 165 features
  my_role_onehot      [5]                    = 5 features
  candidate_onehot    [n_champs]             = 165 features
  patch_normalized    [1]                    = 1 feature
  ─────────────────────────────────────────────────────────
  Total: 1,821 features per sample
  Label: 1 = win, 0 = loss

Usage:
    python data/extract_features.py --limit 1000   # test on 1K matches first
    python data/extract_features.py                 # full run (takes ~hours)
"""

import os
import json
import argparse
import logging
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

#Config

MONGO_URI        = os.getenv("MONGO_URI", "")
OUTPUT_CSV       = Path("data/features.csv")
CHAMPIONS_JSON   = Path("data/champions.json")
ROLES            = ["top", "jungle", "mid", "bot", "support"]
POSITION_MAP     = {
    "TOP":     "top",
    "JUNGLE":  "jungle",
    "MIDDLE":  "mid",
    "BOTTOM":  "bot",
    "UTILITY": "support",
}

#Champion List

def load_champions() -> list[str]:
    """Load the ordered champion list (must match predictor.py)."""
    if not CHAMPIONS_JSON.exists():
        raise FileNotFoundError(
            f"champions.json not found at {CHAMPIONS_JSON}. "
            "Run server/src/scripts/seedChampions.ts first, then export champion names to JSON."
        )
    with open(CHAMPIONS_JSON) as f:
        return json.load(f)


def champion_index(champ_name: str, champion_list: list[str]) -> Optional[int]:
    name_lower = champ_name.lower()
    for i, c in enumerate(champion_list):
        if c.lower() == name_lower:
            return i
    return None


def encode_champion(name: Optional[str], champion_list: list[str]) -> np.ndarray:
    n = len(champion_list)
    vec = np.zeros(n, dtype=np.float32)
    if name:
        idx = champion_index(name, champion_list)
        if idx is not None:
            vec[idx] = 1.0
    return vec


#Feature building

def build_feature_row(
    candidate_name: str,
    candidate_role: str,
    enemy_picks: dict[str, Optional[str]],
    ally_picks:  dict[str, Optional[str]],
    bans:        list[str],
    patch:       str,
    win:         int,
    champion_list: list[str],
) -> np.ndarray:
    """Build one feature vector for a single training sample."""
    n = len(champion_list)

    enemy_vec = np.concatenate([encode_champion(enemy_picks.get(role), champion_list) for role in ROLES])
    ally_roles = [r for r in ROLES if r != candidate_role]
    ally_vec  = np.concatenate([encode_champion(ally_picks.get(role),  champion_list) for role in ally_roles])

    bans_vec = np.zeros(n, dtype=np.float32)
    for ban in bans:
        idx = champion_index(ban, champion_list)
        if idx is not None:
            bans_vec[idx] = 1.0

    role_vec = np.zeros(5, dtype=np.float32)
    if candidate_role in ROLES:
        role_vec[ROLES.index(candidate_role)] = 1.0

    candidate_vec = encode_champion(candidate_name, champion_list)

    try:
        patch_float = float(patch) / 100.0
    except (ValueError, TypeError):
        patch_float = 0.0
    patch_vec = np.array([patch_float], dtype=np.float32)

    return np.concatenate([enemy_vec, ally_vec, bans_vec, role_vec, candidate_vec, patch_vec, [win]])


#Main extraction loop

def extract(limit: Optional[int] = None) -> None:
    champion_list = load_champions()
    log.info(f"Loaded {len(champion_list)} champions.")

    client = MongoClient(MONGO_URI)
    col    = client["draftsense"]["raw_matches"]

    query  = col.find({}, {"picks": 1, "bans": 1, "patch": 1})
    if limit:
        query = query.limit(limit)

    total_matches  = 0
    total_samples  = 0
    rows: list[np.ndarray] = []

    for doc in query:
        try:
            patch = doc.get("patch", "14.0")
            bans  = [b["championName"] for b in doc.get("bans", []) if "championName" in b]

            for team_id, participants in doc["picks"].items():
                #Determine team assignments
                team_picks: dict[str, str] = {}
                for p in participants:
                    role = POSITION_MAP.get(p.get("teamPosition", "NONE"))
                    if role:
                        team_picks[role] = p["championName"]

                #Enemy team = the other team_id
                other_id = "200" if team_id == "100" else "100"
                enemy_team = doc["picks"].get(other_id, [])
                enemy_picks: dict[str, Optional[str]] = {}
                for ep in enemy_team:
                    role = POSITION_MAP.get(ep.get("teamPosition", "NONE"))
                    if role:
                        enemy_picks[role] = ep["championName"]

                for p in participants:
                    role = POSITION_MAP.get(p.get("teamPosition", "NONE"))
                    if not role:
                        continue

                    ally_picks = {r: c for r, c in team_picks.items() if r != role}
                    win = 1 if p["win"] else 0

                    row = build_feature_row(
                        candidate_name=p["championName"],
                        candidate_role=role,
                        enemy_picks=enemy_picks,
                        ally_picks=ally_picks,
                        bans=bans,
                        patch=patch,
                        win=win,
                        champion_list=champion_list,
                    )
                    rows.append(row)
                    total_samples += 1

            total_matches += 1
            if total_matches % 10_000 == 0:
                log.info(f"Processed {total_matches:,} matches → {total_samples:,} samples")

        except Exception as e:
            log.warning(f"Skipping malformed match {doc.get('_id')}: {e}")
            continue

    #Write to CSV
    n_features = rows[0].shape[0] - 1 if rows else 0
    cols = [f"f{i}" for i in range(n_features)] + ["label"]
    df = pd.DataFrame(np.array(rows), columns=cols)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    log.info(f"✅ Wrote {len(df):,} samples × {n_features} features → {OUTPUT_CSV}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract ML features from raw match data")
    parser.add_argument("--limit", type=int, default=None, help="Limit matches (for testing)")
    args = parser.parse_args()
    extract(limit=args.limit)
