"""
FastAPI ML Service - Entry Point
Serves the trained XGBoost draft recommendation model.
Called internally by the Express backend for every /api/recommend request.
"""
import os
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router
from .predictor import DraftPredictor

#Global predictor instance (loaded once on startup)
predictor: Optional[DraftPredictor] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the trained model on startup."""
    global predictor
    model_path = os.getenv("MODEL_PATH", "models/trained/xgboost_v1.pkl")
    predictor = DraftPredictor(model_path)

    status = "✅ loaded" if predictor.is_ready() else "⚠️  no model yet (running in stub mode)"
    print(f"[DraftSense ML] Model status: {status}")
    print(f"[DraftSense ML] FastAPI ready - listening for /predict requests")

    yield  #App runs

    print("[DraftSense ML] Shutting down.")


app = FastAPI(
    title="DraftSense ML Service",
    description="XGBoost champion draft recommendation model, served via FastAPI.",
    version="1.0.0",
    lifespan=lifespan,
)

#Only Express backend calls this service - restrict CORS accordingly.
#In development, localhost:5000 is the Express server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "https://draftsense-api.onrender.com",   #production Express URL
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(router)


def get_predictor() -> Optional[DraftPredictor]:
    """Dependency injection helper - routes import this to access the predictor."""
    return predictor
