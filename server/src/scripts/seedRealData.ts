/*
Real Matchup + Synergy Scraper — Lolalytics (Phase 2)

Fetches actual win-rate data from Lolalytics' internal API.
This REPLACES the synthetic data with real patch statistics.

DISCLAIMER: Lolalytics does not publish an official API.
These endpoints are derived from observing their frontend's
network requests. Use responsibly and respect rate limits.
Do NOT run this aggressively — add delays between requests.

How to find the latest endpoints if this breaks:
1. Open lolalytics.com/lol/vi/counters/ in Chrome
2. Open DevTools → Network tab → filter "api"
3. Look for XHR requests with matchup data
4. Update LOLALYTICS_BASE and ENDPOINT below accordingly

Run: npm run seed:matchups:real
*/

import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosInstance } from 'axios';
import mongoose from 'mongoose';
import Champion from '../models/Champion';
import Matchup from '../models/Matchup';
import Synergy from '../models/Synergy';
import { Role } from '../types';

const MONGO_URI = process.env.MONGO_URI as string;
const PATCH = '26.8';    //<── Update this each patch
const TIER = 'all';   //Options: all, platinum_plus, emerald_plus, diamond_plus
const REGION = 'all';

//Lolalytics API config
const LOLALYTICS_BASE = 'https://lolalytics.com';
const RATE_LIMIT_MS = 800;   //~1.2 requests/sec - be polite

const LANE_MAP: Record<Role, string> = {
  top: 'top',
  jungle: 'jungle',
  mid: 'mid',
  bot: 'adc',
  support: 'support',
};

//HTTP client
const client: AxiosInstance = axios.create({
  baseURL: LOLALYTICS_BASE,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DraftSense/1.0)',
    'Accept': 'application/json',
    'Referer': 'https://lolalytics.com/',
  },
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//Fetch matchups for a single champion in a single role
//Returns map of opponentId → winRate
async function fetchMatchupData(
  championId: string,
  role: Role
): Promise<{ opponentId: string; winRate: number; gamesPlayed: number }[]> {
  const lane = LANE_MAP[role];

  try {
    //Lolalytics counter endpoint (update if endpoint changes)
    const res = await client.get('/api/counters/', {
      params: {
        lane,
        patch: PATCH,
        tier: TIER,
        region: REGION,
        champion: championId,
      },
    });

    const data = res.data;

    //Parse the response structure - adjust field names if Lolalytics changes format
    //Expected format: { counters: [{ champion_id: "Vi", wins: 123, total: 234 }] }
    if (!data?.counters || !Array.isArray(data.counters)) {
      console.warn(`  No counter data for ${championId}/${role}`);
      return [];
    }

    return data.counters.map((entry: any) => ({
      opponentId: entry.champion_id ?? entry.id ?? entry.name,
      winRate: parseFloat(entry.win_rate ?? (entry.wins / entry.total).toFixed(4)),
      gamesPlayed: parseInt(entry.total ?? entry.games ?? 0),
    })).filter((e: any) => e.opponentId && !isNaN(e.winRate));

  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.warn(`  Lolalytics API error for ${championId}/${role}: ${err.response?.status} ${err.message}`);
    } else {
      console.warn(`  Unknown error for ${championId}/${role}:`, err.message);
    }
    return [];
  }
}

//Fetch synergy data for a single champion
async function fetchSynergyData(
  championId: string,
  role: Role
): Promise<{ allyId: string; winRate: number; gamesPlayed: number }[]> {
  const lane = LANE_MAP[role];

  try {
    const res = await client.get('/api/synergies/', {
      params: {
        lane,
        patch: PATCH,
        tier: TIER,
        region: REGION,
        champion: championId,
      },
    });

    const data = res.data;

    if (!data?.synergies || !Array.isArray(data.synergies)) {
      return [];
    }

    return data.synergies.map((entry: any) => ({
      allyId: entry.champion_id ?? entry.id ?? entry.name,
      winRate: parseFloat(entry.win_rate ?? (entry.wins / entry.total).toFixed(4)),
      gamesPlayed: parseInt(entry.total ?? entry.games ?? 0),
    })).filter((e: any) => e.allyId && !isNaN(e.winRate));

  } catch (err: any) {
    console.warn(`  Synergy error for ${championId}/${role}:`, err.message);
    return [];
  }
}

//Main

async function scrapeRealData(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const champions = await Champion.find().lean();
  console.log(`Loaded ${champions.length} champions`);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];
  let matchupsTotal = 0;
  let synergiesTotal = 0;
  let errors = 0;

  for (const champ of champions) {
    for (const role of champ.roles as Role[]) {
      if (!roles.includes(role)) continue;

      process.stdout.write(`\r${champ.name} / ${role}...                    `);

      //Matchups
      const matchupData = await fetchMatchupData(champ.championId, role);
      if (matchupData.length > 0) {
        const matchupOps: mongoose.AnyBulkWriteOperation<any>[] = matchupData.map((m) => ({
          updateOne: {
            filter: { championId: champ.championId, opponentId: m.opponentId, role },
            update: {
              $set: {
                championId: champ.championId,
                opponentId: m.opponentId,
                role,
                winRate: m.winRate,
                gamesPlayed: m.gamesPlayed,
                patch: PATCH,
              },
            },
            upsert: true,
          },
        }));
        await Matchup.bulkWrite(matchupOps, { ordered: false });
        matchupsTotal += matchupOps.length;
      } else {
        errors++;
      }

      await sleep(RATE_LIMIT_MS);

      //Synergies
      const synergyData = await fetchSynergyData(champ.championId, role);
      if (synergyData.length > 0) {
        const synergyOps: mongoose.AnyBulkWriteOperation<any>[] = synergyData.map((s) => ({
          updateOne: {
            filter: { championId: champ.championId, allyId: s.allyId },
            update: {
              $set: {
                championId: champ.championId,
                allyId: s.allyId,
                winRate: s.winRate,
                gamesPlayed: s.gamesPlayed,
                patch: PATCH,
              },
            },
            upsert: true,
          },
        }));
        await Synergy.bulkWrite(synergyOps, { ordered: false });
        synergiesTotal += synergyOps.length;
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n\nReal data scraping complete!`);
  console.log(`   ${matchupsTotal} matchup records updated`);
  console.log(`   ${synergiesTotal} synergy records updated`);
  if (errors > 0) {
    console.warn(`   ${errors} champion/role combos returned no data (may need endpoint update)`);
  }
}

scrapeRealData()
  .catch((err) => {
    console.error('Real data scraping failed:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  });
