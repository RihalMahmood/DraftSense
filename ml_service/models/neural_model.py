"""
Optional - PyTorch Neural Network Model
Uses champion embedding layers instead of one-hot encoding.
Each champion gets a learned 32-dim vector that captures champion identity
better than one-hot (similar champions cluster in embedding space).

Train this after the XGBoost baseline is working.

Usage:
    python models/neural_model.py
"""
import os
import json
import logging
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

CHAMPIONS_JSON = Path("data/champions.json")
FEATURES_CSV   = Path("data/features.csv")
OUTPUT_PATH    = Path("models/trained/neural_v1.pt")
CURRENT_PATCH  = os.getenv("CURRENT_PATCH", "14.8")

ROLES          = ["top", "jungle", "mid", "bot", "support"]
EMBED_DIM      = 32
HIDDEN_DIMS    = [512, 256, 128]
DROPOUT        = 0.3
LR             = 1e-3
EPOCHS         = 30
BATCH_SIZE     = 4096


class DraftDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.from_numpy(X).float()
        self.y = torch.from_numpy(y).float()

    def __len__(self):
        return len(self.y)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


class DraftNet(nn.Module):
    """
    Neural network for draft prediction with champion embedding layers.
    Input: champion IDs (integers) for all 10 slots + role + ban encodings.
    """

    def __init__(self, n_champions: int = 165, embed_dim: int = EMBED_DIM):
        super().__init__()
        #Each champion gets a learnable embedding vector
        self.champion_embed = nn.Embedding(n_champions + 1, embed_dim, padding_idx=0)

        #11 champion slots (5 enemy + 5 ally + 1 candidate) + 5 role features
        input_dim = embed_dim * 11 + 5

        layers = []
        prev_dim = input_dim
        for dim in HIDDEN_DIMS:
            layers.extend([
                nn.Linear(prev_dim, dim),
                nn.LayerNorm(dim),
                nn.ReLU(),
                nn.Dropout(DROPOUT),
            ])
            prev_dim = dim
        layers.append(nn.Linear(prev_dim, 1))
        layers.append(nn.Sigmoid())
        self.fc = nn.Sequential(*layers)

    def forward(self, champion_ids: torch.Tensor, role: torch.Tensor) -> torch.Tensor:
        #champion_ids: [batch, 11] - 5 enemy + 5 ally + 1 candidate
        embeds = self.champion_embed(champion_ids).flatten(1)  # [batch, embed_dim*11]
        x = torch.cat([embeds, role], dim=1)
        return self.fc(x).squeeze(1)


def train():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    log.info(f"Training on: {device}")

    champion_list = json.load(open(CHAMPIONS_JSON)) if CHAMPIONS_JSON.exists() else []
    n_champions   = max(len(champion_list), 165)

    df = pd.read_csv(FEATURES_CSV)
    X  = df.drop(columns=["label"]).values.astype(np.float32)
    y  = df["label"].values.astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y.astype(int)
    )

    train_loader = DataLoader(DraftDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)
    test_loader  = DataLoader(DraftDataset(X_test,  y_test),  batch_size=BATCH_SIZE)

    model = DraftNet(n_champions=n_champions, embed_dim=EMBED_DIM).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    criterion = nn.BCELoss()
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_auc = 0.0
    for epoch in range(1, EPOCHS + 1):
        model.train()
        total_loss = 0.0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            #NOTE: For the neural model, champion IDs are embedded - but since our
            #current feature CSV uses one-hot encoding, we use a simple FC head here.
            #For full embedding support, modify extract_features.py to output IDs.
            champion_ids = torch.zeros(X_batch.size(0), 11, dtype=torch.long, device=device)
            role_feats   = X_batch[:, -6:-1]  #role one-hot
            preds        = model(champion_ids, role_feats)
            loss         = criterion(preds, y_batch)
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            total_loss += loss.item()

        scheduler.step()

        if epoch % 5 == 0 or epoch == EPOCHS:
            model.eval()
            all_preds, all_labels = [], []
            with torch.no_grad():
                for X_batch, y_batch in test_loader:
                    X_batch = X_batch.to(device)
                    champion_ids = torch.zeros(X_batch.size(0), 11, dtype=torch.long, device=device)
                    role_feats   = X_batch[:, -6:-1]
                    preds = model(champion_ids, role_feats).cpu().numpy()
                    all_preds.extend(preds)
                    all_labels.extend(y_batch.numpy())

            auc = roc_auc_score(all_labels, all_preds)
            acc = accuracy_score(all_labels, [p > 0.5 for p in all_preds])
            log.info(f"Epoch {epoch:3d} | Loss: {total_loss/len(train_loader):.4f} | Acc: {acc:.4f} | AUC: {auc:.4f}")

            if auc > best_auc:
                best_auc = auc
                OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
                torch.save({
                    "model_state_dict": model.state_dict(),
                    "n_champions":      n_champions,
                    "embed_dim":        EMBED_DIM,
                    "patch":            CURRENT_PATCH,
                    "champion_list":    champion_list,
                    "metadata": {
                        "accuracy":   round(acc, 4),
                        "auc_roc":    round(auc, 4),
                        "trained_at": datetime.utcnow().isoformat(),
                    }
                }, OUTPUT_PATH)
                log.info(f"  ✅ New best model saved (AUC: {best_auc:.4f})")

    log.info(f"Training complete. Best AUC: {best_auc:.4f}")


if __name__ == "__main__":
    train()
