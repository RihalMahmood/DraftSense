import Champion from '../models/Champion';
import Matchup from '../models/Matchup';
import Synergy from '../models/Synergy';
import {
  RecommendRequest,
  ScoredChampion,
  Role,
} from '../types';

//Shape returned by .lean() — plain JS objects without Mongoose Document overhead
interface LeanChampion {
  championId: string;
  name: string;
  title: string;
  imageUrl: string;
  splashUrl: string;
  roles: Role[];
  tags: string[];
}

const COUNTER_WEIGHT = 0.6;
const SYNERGY_WEIGHT = 0.4;

/*
Calculates win rate of `candidateId` against each enemy champion
in the candidate's role. Returns a 0–100 counter score
*/
async function calcCounterScore(
  candidateId: string,
  role: Role,
  enemyIds: string[]
): Promise<number> {
  if (enemyIds.length === 0) return 50;   //neutral baseline

  const matchups = await Matchup.find({
    championId: candidateId,
    opponentId: { $in: enemyIds },
    role,
  });

  if (matchups.length === 0) return 50;

  const avg =
    matchups.reduce((sum, m) => sum + m.winRate, 0) / matchups.length;
  return parseFloat((avg * 100).toFixed(2));
}

/*
Calculates duo win rate of `candidateId` with each ally champion.
Returns a 0–100 synergy score
*/
async function calcSynergyScore(
  candidateId: string,
  allyIds: string[]
): Promise<number> {
  if (allyIds.length === 0) return 50;

  const synergies = await Synergy.find({
    championId: candidateId,
    allyId: { $in: allyIds },
  });

  if (synergies.length === 0) return 50;

  const avg =
    synergies.reduce((sum, s) => sum + s.winRate, 0) / synergies.length;
  return parseFloat((avg * 100).toFixed(2));
}

/*
Main scoring function. Returns champions scored for counter, synergy,
and overall — sorted descending. Banned champions are excluded.
*/
export const scoreChampions = async (
  req: RecommendRequest
): Promise<{
  counterPicks: ScoredChampion[];
  synergyPicks: ScoredChampion[];
  overallBest: ScoredChampion[];
}> => {
  const { myRole, bans, enemyPicks, allyPicks } = req;

  //Build flat lists of picked / banned champion IDs
  const allPicked = [
    ...Object.values(enemyPicks).filter(Boolean),
    ...Object.values(allyPicks).filter(Boolean),
  ] as string[];
  const excluded = new Set([...bans, ...allPicked]);

  //Fetch all champions playable in myRole
  const candidates = await Champion.find({ roles: myRole }).lean() as unknown as LeanChampion[];

  const scored: ScoredChampion[] = [];

  const enemyIds = Object.values(enemyPicks).filter(Boolean) as string[];
  const allyIds = Object.values(allyPicks).filter(Boolean) as string[];

  for (const champion of candidates) {
    if (excluded.has(champion.championId)) continue;

    const counterScore = await calcCounterScore(champion.championId, myRole, enemyIds);
    const synergyScore = await calcSynergyScore(champion.championId, allyIds);
    const overallScore = parseFloat(
      (counterScore * COUNTER_WEIGHT + synergyScore * SYNERGY_WEIGHT).toFixed(2)
    );

    scored.push({ champion: champion as any, counterScore, synergyScore, overallScore });
  }

  const counterPicks = [...scored]
    .sort((a, b) => b.counterScore - a.counterScore)
    .slice(0, 5);

  const synergyPicks = [...scored]
    .sort((a, b) => b.synergyScore - a.synergyScore)
    .slice(0, 5);

  const overallBest = [...scored]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 3);

  return { counterPicks, synergyPicks, overallBest };
};
