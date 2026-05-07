import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scoreChampions } from '../services/statsService';
import { getMLScore } from '../services/mlService';
import { generatePickExplanation } from '../services/explanationService';
import { RecommendRequest, ScoredChampion } from '../types';

const TeamPicksSchema = z.object({
  top: z.string().nullable().optional(),
  jungle: z.string().nullable().optional(),
  mid: z.string().nullable().optional(),
  bot: z.string().nullable().optional(),
  support: z.string().nullable().optional(),
});

const RecommendSchema = z.object({
  myRole: z.enum(['top', 'jungle', 'mid', 'bot', 'support']),
  bans: z.array(z.string()).max(10).default([]),
  enemyPicks: TeamPicksSchema.default({}),
  allyPicks: TeamPicksSchema.default({}),
});

/*
Attempts to enrich a scored champion with ML service scores.
Falls back to the existing statsService scores if ML is unavailable.
Once the model is fully trained and deployed, statsService becomes a fallback only.
*/
async function enrichWithML(
  pick: ScoredChampion,
  input: RecommendRequest
): Promise<ScoredChampion> {
  const mlResult = await getMLScore({
    my_role: input.myRole,
    candidate_champion: pick.champion.name,
    enemy_picks: input.enemyPicks as Record<string, string | null>,
    ally_picks: input.allyPicks as Record<string, string | null>,
    bans: input.bans,
  });

  //ML service available and has a trained model → override scores
  if (mlResult) {
    return {
      ...pick,
      counterScore: parseFloat((mlResult.counter_score * 100).toFixed(2)),
      synergyScore: parseFloat((mlResult.synergy_score * 100).toFixed(2)),
      overallScore: parseFloat((mlResult.overall_score * 100).toFixed(2)),
    };
  }

  //ML service not ready → keep existing statsService scores unchanged
  return pick;
}

export const recommend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = RecommendSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
      return;
    }

    const input = parsed.data as RecommendRequest;

    //Phase 0–2: statsService provides scores from MongoDB matchup/synergy data.
    //Phase 3+:  ML service overrides scores per-champion (enrichWithML).
    const { counterPicks, synergyPicks, overallBest } = await scoreChampions(input);

    //Enrich each group with ML scores (no-op if ML service is offline/not trained)
    const [enrichedCounters, enrichedSynergies, enrichedOverall] = await Promise.all([
      Promise.all(counterPicks.map((p) => enrichWithML(p, input))),
      Promise.all(synergyPicks.map((p) => enrichWithML(p, input))),
      Promise.all(overallBest.map((p) => enrichWithML(p, input))),
    ]);

    const mapScoredChampion = (sc: ScoredChampion & { aiExplanation?: string }) => ({
      ...sc.champion,
      id: (sc.champion as any).championId ?? sc.champion.id,
      image: sc.champion.imageUrl.split('/').pop(),
      counterScore: sc.counterScore,
      synergyScore: sc.synergyScore,
      overallScore: sc.overallScore,
      explanation: generatePickExplanation(
        sc.champion.name,
        sc.counterScore,
        sc.synergyScore,
        input.enemyPicks as Record<string, string | null>,
        input.allyPicks as Record<string, string | null>
      ),
    });

    res.json({
      counterPicks: enrichedCounters.map(mapScoredChampion),
      synergyPicks: enrichedSynergies.map(mapScoredChampion),
      overallBest: enrichedOverall.map(mapScoredChampion),
    });
  } catch (err) {
    next(err);
  }
};
