import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { scoreChampions } from '../services/statsService';
import { enrichRecommendations } from '../services/aiService';
import { RecommendRequest, Role } from '../types';

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

    //Score champions using matchup + synergy DB data
    const { counterPicks, synergyPicks, overallBest } =
      await scoreChampions(input);

    //Enrich top picks with AI explanations (non-blocking fallback)
    const [enrichedCounters, enrichedSynergies, enrichedOverall] =
      await Promise.all([
        enrichRecommendations(input, counterPicks),
        enrichRecommendations(input, synergyPicks),
        enrichRecommendations(input, overallBest),
      ]);

    const mapScoredChampion = (sc: any) => ({
      ...sc.champion,
      id: sc.champion.championId,
      image: sc.champion.imageUrl.split('/').pop(),
      aiExplanation: sc.aiExplanation,
      counterScore: sc.counterScore,
      synergyScore: sc.synergyScore,
      overallScore: sc.overallScore
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
