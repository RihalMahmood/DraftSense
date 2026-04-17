import axios from 'axios';
import dotenv from 'dotenv';
import {
  RecommendRequest,
  ScoredChampion,
  BuildRequest,
  BuildResponse,
} from '../types';

dotenv.config();

const AI_PROVIDER = process.env.AI_PROVIDER ?? 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1:8b';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';

//Helpers

function buildRecommendPrompt(
  req: RecommendRequest,
  topPicks: ScoredChampion[]
): string {
  const pickList = topPicks
    .map(
      (p, i) =>
        `${i + 1}. ${p.champion.name} (counter: ${p.counterScore}, synergy: ${p.synergyScore}, overall: ${p.overallScore})`
    )
    .join('\n');

  const enemy = Object.entries(req.enemyPicks)
    .filter(([, v]) => v)
    .map(([role, champ]) => `${role}: ${champ}`)
    .join(', ');

  const ally = Object.entries(req.allyPicks)
    .filter(([, v]) => v)
    .map(([role, champ]) => `${role}: ${champ}`)
    .join(', ');

  return `
You are a professional League of Legends coach and champion select expert.
Respond with ONLY valid JSON — no markdown, no extra text.

The player is playing: ${req.myRole}
Enemy team: ${enemy || 'unknown'}
Ally team: ${ally || 'unknown'}
Bans: ${req.bans.join(', ') || 'none'}

Our scoring algorithm ranked these champion picks for this role:
${pickList}

For each champion provide a short (2-3 sentence) explanation of WHY they are a strong pick in this draft.
Focus on specific matchup reasons, synergies, or win conditions.

Respond ONLY with this JSON structure:
{
  "explanations": [
    { "champion": "<name>", "reason": "<explanation>" }
  ]
}
`.trim();
}

function buildGuidePrompt(req: BuildRequest): string {
  const enemy = Object.entries(req.enemyPicks)
    .filter(([, v]) => v)
    .map(([role, champ]) => `${role}: ${champ}`)
    .join(', ');

  return `
You are a League of Legends expert coach.
Respond with ONLY valid JSON — no markdown, no extra text.

Champion: ${req.champion}
Role: ${req.role}
Enemy team: ${enemy || 'unknown'}

Write a short (2-3 sentence) build narration explaining the recommended item path and rune choices
given this specific enemy composition. Mention key threats or win conditions.

Respond ONLY with:
{ "narration": "<explanation>" }
`.trim();
}

//Ollama — local LLM

async function callOllama(prompt: string): Promise<string> {
  const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    format: 'json',
  }, { timeout: 90000 });  // llama3.1:8b needs plenty of time on first load
  return response.data.response as string;
}

//Anthropic Claude — production fallback(not used right now, might use later)

async function callAnthropic(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 15000,
    }
  );
  return response.data.content[0].text as string;
}

//Provider router

async function callAI(prompt: string): Promise<string> {
  if (AI_PROVIDER === 'anthropic') {
    return callAnthropic(prompt);
  }
  return callOllama(prompt);
}

//Public API

/*
Enriches top picks with AI-generated explanations.
Falls back gracefully if AI is unavailable.
*/
export const enrichRecommendations = async (
  req: RecommendRequest,
  picks: ScoredChampion[]
): Promise<ScoredChampion[]> => {
  try {
    const raw = await callAI(buildRecommendPrompt(req, picks));
    const parsed = JSON.parse(raw) as {
      explanations: { champion: string; reason: string }[];
    };

    const explanationMap = new Map(
      parsed.explanations.map((e) => [e.champion.toLowerCase(), e.reason])
    );

    return picks.map((p) => ({
      ...p,
      aiExplanation:
        explanationMap.get(p.champion.name.toLowerCase()) ??
        'No AI explanation available.',
    }));
  } catch (err) {
    console.warn('⚠️  AI enrichment failed, returning picks without explanations:', err);
    return picks;
  }
};

//Generates a build narration for a chosen champion
export const generateBuildNarration = async (
  req: BuildRequest
): Promise<string> => {
  try {
    const raw = await callAI(buildGuidePrompt(req));
    const parsed = JSON.parse(raw) as { narration: string };
    return parsed.narration;
  } catch (err) {
    console.warn('⚠️  Build narration AI call failed:', err);
    return 'AI narration unavailable.';
  }
};
