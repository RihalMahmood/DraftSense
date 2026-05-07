import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Build from '../models/Build';
import { generateBuildNarration } from '../services/explanationService';
import { BuildRequest } from '../types';

const TeamPicksSchema = z.object({
  top: z.string().nullable().optional(),
  jungle: z.string().nullable().optional(),
  mid: z.string().nullable().optional(),
  bot: z.string().nullable().optional(),
  support: z.string().nullable().optional(),
});

const BuildSchema = z.object({
  champion: z.string().min(1),
  role: z.enum(['top', 'jungle', 'mid', 'bot', 'support']),
  enemyPicks: TeamPicksSchema.default({}),
});

export const getBuild = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = BuildSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        details: parsed.error.flatten(),
      });
      return;
    }

    const input = parsed.data as BuildRequest;

    const build = await Build.findOne({
      championId: input.champion,
      role: input.role,
    }).lean();

    if (!build) {
      res.status(404).json({
        error: `No build found for ${input.champion} in ${input.role}`,
      });
      return;
    }

    //Template-based narration - no LLM required
    const narration = generateBuildNarration(
      input.champion,
      input.role,
      input.enemyPicks as Record<string, string | null>
    );

    res.json({ ...build, narration });
  } catch (err) {
    next(err);
  }
};
