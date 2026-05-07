/*
Template-based explanation engine.
Generates pick and build rationale from numeric scores + draft context.
No LLM — deterministic, free, fully hostable, more factually reliable.
*/

type TeamPicks = Record<string, string | null | undefined>;

//Champion synergy/counter knowledge
//Expand these maps over time as patterns emerge from training data analysis.

const KNOWN_COUNTERS: Record<string, string[]> = {
  Vi: ['Amumu', 'Warwick', 'Lillia'],
  Jinx: ['Draven', 'Caitlyn', 'Miss Fortune'],
  Syndra: ['Galio', 'LeBlanc', 'Kassadin'],
  Thresh: ['Blitzcrank', 'Morgana', 'Leona'],
  Darius: ['Vayne', 'Gnar', 'Teemo'],
  Camille: ['Malphite', 'Garen', 'Cho\'Gath'],
  Ezreal: ['Draven', 'Jinx', 'Caitlyn'],
};

const KNOWN_SYNERGIES: Record<string, string[]> = {
  Vi: ['Jinx', 'Caitlyn', 'Ashe'],       //hard engage + follow-up
  Amumu: ['Fiddlesticks', 'Orianna'],        //double AoE ults
  Jinx: ['Thresh', 'Nautilus', 'Vi'],       //peel + hard engage
  Lulu: ['Jinx', 'Vayne', 'Twitch'],        //hypercarry enablers
  Orianna: ['Amumu', 'Jarvan IV', 'Malphite'],
};

export function isCounterTo(champion: string, opponent: string): boolean {
  const counters = KNOWN_COUNTERS[champion] ?? [];
  return counters.some((c) => c.toLowerCase() === opponent.toLowerCase());
}

export function hasSynergy(champion: string, ally: string): boolean {
  const synergies = KNOWN_SYNERGIES[champion] ?? [];
  return synergies.some((a) => a.toLowerCase() === ally.toLowerCase());
}

//Pick explanation

export function generatePickExplanation(
  champion: string,
  counterScore: number,    //0–100 (from statsService) or 0–1 scaled from ML
  synergyScore: number,
  enemyPicks: TeamPicks,
  allyPicks: TeamPicks
): string {
  //Normalise to 0–1 if statsService passes 0–100
  const cScore = counterScore > 1 ? counterScore / 100 : counterScore;
  const sScore = synergyScore > 1 ? synergyScore / 100 : synergyScore;

  const lines: string[] = [];

  //Counter angle
  if (cScore >= 0.75) {
    lines.push(`${champion} has strong favorable matchups against the current enemy lineup.`);
  } else if (cScore >= 0.55) {
    lines.push(`${champion} holds even matchups against the enemy composition.`);
  } else if (cScore < 0.45) {
    lines.push(`${champion} faces some tough matchups this game — play safely early.`);
  }

  //Specific counter callouts
  for (const [, enemyChamp] of Object.entries(enemyPicks)) {
    if (enemyChamp && isCounterTo(champion, enemyChamp)) {
      lines.push(`Directly counters ${enemyChamp} with favorable matchup mechanics.`);
      break;  //one callout is enough
    }
  }

  //Synergy angle
  if (sScore >= 0.72) {
    lines.push(`Excellent synergy with the current ally team — win conditions align well.`);
  } else if (sScore >= 0.55) {
    lines.push(`Decent coordination potential with current allies.`);
  }

  //Specific synergy callouts
  for (const [, allyChamp] of Object.entries(allyPicks)) {
    if (allyChamp && hasSynergy(champion, allyChamp)) {
      lines.push(`Pairs especially well with ${allyChamp} — strong engage + follow-up combination.`);
      break;
    }
  }

  //Fallback if no lines triggered
  if (lines.length === 0) {
    lines.push(`${champion} is a solid pick for this draft based on overall scoring.`);
  }

  return lines.join(' ');
}

//Build narration

const THREAT_ITEMS: Record<string, string> = {
  Darius: 'early Bramble Vest',
  Syndra: 'Magic Resist boots + Null-Magic Mantle',
  Jinx: 'Quicksilver Sash to handle her Chompers',
  Thresh: 'Tenacity boots to reduce hook CC duration',
  Camille: 'Plated Steelcaps and Frozen Heart',
};

export function generateBuildNarration(
  champion: string,
  role: string,
  enemyPicks: TeamPicks
): string {
  const lines: string[] = [
    `Standard ${champion} ${role} build path prioritizes core items that maximize your win conditions.`,
  ];

  const threats: string[] = [];
  for (const [, enemyChamp] of Object.entries(enemyPicks)) {
    if (enemyChamp && THREAT_ITEMS[enemyChamp]) {
      threats.push(`${THREAT_ITEMS[enemyChamp]} against ${enemyChamp}`);
    }
  }

  if (threats.length > 0) {
    lines.push(`Consider picking up ${threats.slice(0, 2).join(' and ')} in your situational slots.`);
  } else {
    lines.push(`No extreme threats detected — follow the standard build order and adapt situationally.`);
  }

  return lines.join(' ');
}
