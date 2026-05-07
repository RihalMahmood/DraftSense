"""
FastAPI routes for the ML service.
  POST /predict     - score a candidate champion against a draft state
  GET  /health      - liveness check (used by Render, Express startup)
  GET  /model/info  - training metadata (accuracy, patch, champion count)
"""
from typing import Optional
from fastapi import APIRouter, Depends

from .schemas import PredictRequest, PredictResponse, HealthResponse, ModelInfoResponse
from .predictor import DraftPredictor

router = APIRouter()


def get_predictor() -> Optional[DraftPredictor]:
    """Import from main at runtime to avoid circular imports."""
    from .main import get_predictor as _get
    return _get()


@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, predictor: Optional[DraftPredictor] = Depends(get_predictor)):
    """
    Score a single candidate champion against the current draft state.
    Returns null scores if no trained model is available.
    """
    if not predictor:
        return PredictResponse()
    return predictor.predict(req)


@router.get("/health", response_model=HealthResponse)
def health(predictor: Optional[DraftPredictor] = Depends(get_predictor)):
    """Liveness check."""
    if not predictor:
        return HealthResponse(status="ok", ready=False)
    
    return HealthResponse(
        status="ok",
        model=predictor.model_name,
        patch=predictor.patch,
        ready=predictor.is_ready(),
    )


@router.get("/model/info", response_model=ModelInfoResponse)
def model_info(predictor: Optional[DraftPredictor] = Depends(get_predictor)):
    """Training metadata."""
    if not predictor:
        return ModelInfoResponse(ready=False)
        
    meta = predictor.metadata
    return ModelInfoResponse(
        model_name=predictor.model_name,
        patch=predictor.patch,
        accuracy=meta.get("accuracy"),
        auc_roc=meta.get("auc_roc"),
        training_samples=meta.get("training_samples"),
        trained_at=meta.get("trained_at"),
        champion_count=len(predictor.champion_list) or None,
        ready=predictor.is_ready(),
    )
