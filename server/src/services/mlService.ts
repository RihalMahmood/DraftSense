import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
const ML_TIMEOUT_MS = 5000;   //5s — fast enough for ~50ms inference, generous for cold starts

export interface MLPredictRequest {
  my_role: string;
  candidate_champion: string;
  enemy_picks: Record<string, string | null>;
  ally_picks: Record<string, string | null>;
  bans: string[];
}

export interface MLPredictResponse {
  counter_score: number;     //0.0 – 1.0 predicted win rate vs enemy
  synergy_score: number;     //0.0 – 1.0 predicted win rate with allies
  overall_score: number;     //weighted combined score
  patch: string;             //model was trained on this patch
}

/*
Calls FastAPI /predict for a single candidate champion.
Returns null if the ML service is unreachable or has no trained model yet.
The caller (recommendController) falls back to statsService scores in that case.
*/
export async function getMLScore(
  req: MLPredictRequest
): Promise<MLPredictResponse | null> {
  try {
    const response = await axios.post<MLPredictResponse>(
      `${ML_SERVICE_URL}/predict`,
      req,
      { timeout: ML_TIMEOUT_MS }
    );

    //If the service responded but has no model yet, it returns null scores
    if (
      response.data.counter_score === null ||
      response.data.synergy_score === null
    ) {
      return null;
    }

    return response.data;
  } catch (err) {
    //ML service is not running, not deployed yet, or model not trained — that's fine.
    //statsService fallback will handle scoring.
    return null;
  }
}

/*
Health check — used on startup to log whether the ML service is available.
Not required for normal operation.
*/
export async function checkMLServiceHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    return response.data?.status === 'ok';
  } catch {
    return false;
  }
}
