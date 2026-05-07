"""
Pydantic schemas for FastAPI request/response validation.
Mirrors the TypeScript types in server/src/types/index.ts.
"""
from typing import Optional
from pydantic import BaseModel, Field


class TeamPicks(BaseModel):
    top:     Optional[str] = None
    jungle:  Optional[str] = None
    mid:     Optional[str] = None
    bot:     Optional[str] = None
    support: Optional[str] = None


class PredictRequest(BaseModel):
    my_role:            str             = Field(..., description="Role the player is filling")
    candidate_champion: str             = Field(..., description="Champion to score")
    enemy_picks:        TeamPicks       = Field(default_factory=TeamPicks)
    ally_picks:         TeamPicks       = Field(default_factory=TeamPicks)
    bans:               list[str]       = Field(default_factory=list)


class PredictResponse(BaseModel):
    counter_score:  Optional[float] = Field(None, description="Win rate vs enemy (0.0–1.0), null if no model")
    synergy_score:  Optional[float] = Field(None, description="Win rate with allies (0.0–1.0), null if no model")
    overall_score:  Optional[float] = Field(None, description="Weighted combined score, null if no model")
    patch:          Optional[str]   = Field(None, description="Patch the model was trained on")


class HealthResponse(BaseModel):
    status: str
    model:  Optional[str] = None
    patch:  Optional[str] = None
    ready:  bool


class ModelInfoResponse(BaseModel):
    model_name:       Optional[str]   = None
    patch:            Optional[str]   = None
    accuracy:         Optional[float] = None
    auc_roc:          Optional[float] = None
    training_samples: Optional[int]   = None
    trained_at:       Optional[str]   = None
    champion_count:   Optional[int]   = None
    ready:            bool
