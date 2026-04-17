/*
Matchup Seeder — Synthetic Data (Phase 1)

Generates realistic win-rate data for every champion pair in each role.

Strategy:
 - Uses champion tag matchup bias matrix (e.g. Assassins beat Mages)
 - Adds ±5% gaussian-like random noise
 - Clamps win rates to [0.43, 0.57] for realism

Run: npm run seed:matchups

Replace later with real data via: npm run seed:matchups:real
*/

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Champion from '../models/Champion';
import Matchup from '../models/Matchup';
import { Role } from '../types';

const MONGO_URI = process.env.MONGO_URI as string;
const PATCH = '26.8';

//Tag advantage matrix
//bias[tagA][tagB] = win rate advantage for tagA when facing tagB
//0.50 = even, 0.53 = slight advantage, 0.46 = slight disadvantage
const TAG_BIAS: Record<string, Record<string, number>> = {
  Assassin: { Assassin: 0.50, Fighter: 0.47, Mage: 0.54, Marksman: 0.53, Support: 0.54, Tank: 0.44 },
  Fighter: { Assassin: 0.53, Fighter: 0.50, Mage: 0.51, Marksman: 0.52, Support: 0.53, Tank: 0.49 },
  Mage: { Assassin: 0.46, Fighter: 0.49, Mage: 0.50, Marksman: 0.50, Support: 0.52, Tank: 0.51 },
  Marksman: { Assassin: 0.47, Fighter: 0.48, Mage: 0.50, Marksman: 0.50, Support: 0.52, Tank: 0.53 },
  Support: { Assassin: 0.46, Fighter: 0.47, Mage: 0.48, Marksman: 0.48, Support: 0.50, Tank: 0.51 },
  Tank: { Assassin: 0.56, Fighter: 0.51, Mage: 0.49, Marksman: 0.47, Support: 0.49, Tank: 0.50 },
};

function getPrimaryTag(tags: string[]): string {
  const order = ['Assassin', 'Mage', 'Marksman', 'Tank', 'Fighter', 'Support'];
  return order.find((t) => tags.includes(t)) ?? 'Fighter';
}

function getTagBias(tagsA: string[], tagsB: string[]): number {
  const a = getPrimaryTag(tagsA);
  const b = getPrimaryTag(tagsB);
  return TAG_BIAS[a]?.[b] ?? 0.50;
}

//Adds bounded noise: result stays within clampMin..clampMax
function addNoise(base: number, spread = 0.04, clampMin = 0.43, clampMax = 0.57): number {
  const noise = (Math.random() - 0.5) * 2 * spread;
  return Math.min(clampMax, Math.max(clampMin, base + noise));
}

//Role mapping
//Maps role label → Data Dragon tags that frequently play that role
const ROLE_TAGS: Record<Role, string[]> = {
  top: ['Fighter', 'Tank'],
  jungle: ['Fighter', 'Assassin', 'Tank'],
  mid: ['Mage', 'Assassin'],
  bot: ['Marksman'],
  support: ['Support', 'Tank', 'Mage'],
};

function champPlayableInRole(tags: string[], role: Role): boolean {
  const roleTags = ROLE_TAGS[role];
  return tags.some((t) => roleTags.includes(t));
}

//Main

async function seedMatchups(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const champions = await Champion.find().lean();
  console.log(`Loaded ${champions.length} champions`);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];
  let total = 0;
  let skipped = 0;

  for (const role of roles) {
    //Champions valid for this role
    const inRole = champions.filter((c) => champPlayableInRole(c.tags, role));

    console.log(`\n Role: ${role} — ${inRole.length} champions`);

    const ops: mongoose.AnyBulkWriteOperation<any>[] = [];

    for (const champA of inRole) {
      for (const champB of champions) {
        if (champA.championId === champB.championId) continue;

        const winRate = addNoise(getTagBias(champA.tags, champB.tags));
        const gamesPlayed = Math.floor(Math.random() * 3000) + 500;

        ops.push({
          updateOne: {
            filter: {
              championId: champA.championId,
              opponentId: champB.championId,
              role,
            },
            update: {
              $set: {
                championId: champA.championId,
                opponentId: champB.championId,
                role,
                winRate: parseFloat(winRate.toFixed(4)),
                gamesPlayed,
                patch: PATCH,
              },
            },
            upsert: true,
          },
        });
      }

      //Flush in batches of 500 to avoid memory issues
      if (ops.length >= 500) {
        await Matchup.bulkWrite(ops, { ordered: false });
        total += ops.length;
        ops.length = 0;
        process.stdout.write(`  ↳ ${total} matchups written...\r`);
      }
    }

    //Flush remainder
    if (ops.length > 0) {
      await Matchup.bulkWrite(ops, { ordered: false });
      total += ops.length;
    }

    console.log(`  ${role} done`);
  }

  console.log(`\n Matchup seeding complete! ${total} documents upserted (${skipped} skipped)`);
  console.log(' This is SYNTHETIC data. Replace with real data using: npm run seed:matchups:real');
}

seedMatchups()
  .catch((err) => {
    console.error('❌ Matchup seeding failed:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  });
