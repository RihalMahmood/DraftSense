/*
Synergy Seeder — Synthetic Data (Phase 1)

Generates duo win-rate data for allied champion pairs.

Strategy:
 - Champions with complementary tags get a synergy bonus
 - e.g. Engage Support + Fighter = high synergy
 - Adds ±4% noise, clamped to [0.44, 0.56]

Run: npm run seed:synergies
*/

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Champion from '../models/Champion';
import Synergy from '../models/Synergy';

const MONGO_URI = process.env.MONGO_URI as string;
const PATCH = '26.8';

//Synergy bias matrix
//symBias[tagA][tagB] = duo win rate when these two tag types play together
//(regardless of order — we'll normalise when reading)
const SYNERGY_BIAS: Record<string, Record<string, number>> = {
  Assassin: { Assassin: 0.49, Fighter: 0.51, Mage: 0.51, Marksman: 0.50, Support: 0.52, Tank: 0.51 },
  Fighter: { Assassin: 0.51, Fighter: 0.50, Mage: 0.51, Marksman: 0.51, Support: 0.53, Tank: 0.52 },
  Mage: { Assassin: 0.51, Fighter: 0.51, Mage: 0.50, Marksman: 0.52, Support: 0.54, Tank: 0.52 },
  Marksman: { Assassin: 0.50, Fighter: 0.51, Mage: 0.52, Marksman: 0.50, Support: 0.55, Tank: 0.51 },
  Support: { Assassin: 0.52, Fighter: 0.53, Mage: 0.54, Marksman: 0.55, Support: 0.50, Tank: 0.53 },
  Tank: { Assassin: 0.51, Fighter: 0.52, Mage: 0.52, Marksman: 0.51, Support: 0.53, Tank: 0.50 },
};

function getPrimaryTag(tags: string[]): string {
  const order = ['Support', 'Tank', 'Mage', 'Marksman', 'Assassin', 'Fighter'];
  return order.find((t) => tags.includes(t)) ?? 'Fighter';
}

function getSynergyBias(tagsA: string[], tagsB: string[]): number {
  const a = getPrimaryTag(tagsA);
  const b = getPrimaryTag(tagsB);
  return SYNERGY_BIAS[a]?.[b] ?? 0.50;
}

function addNoise(base: number, spread = 0.035, clampMin = 0.44, clampMax = 0.56): number {
  const noise = (Math.random() - 0.5) * 2 * spread;
  return Math.min(clampMax, Math.max(clampMin, base + noise));
}

async function seedSynergies(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const champions = await Champion.find().lean();
  console.log(`📋 Loaded ${champions.length} champions`);

  let total = 0;
  const ops: mongoose.AnyBulkWriteOperation<any>[] = [];

  for (let i = 0; i < champions.length; i++) {
    const champA = champions[i];
    for (let j = 0; j < champions.length; j++) {
      if (i === j) continue;
      const champB = champions[j];

      const winRate = addNoise(getSynergyBias(champA.tags, champB.tags));
      const gamesPlayed = Math.floor(Math.random() * 2000) + 300;

      ops.push({
        updateOne: {
          filter: { championId: champA.championId, allyId: champB.championId },
          update: {
            $set: {
              championId: champA.championId,
              allyId: champB.championId,
              winRate: parseFloat(winRate.toFixed(4)),
              gamesPlayed,
              patch: PATCH,
            },
          },
          upsert: true,
        },
      });

      if (ops.length >= 1000) {
        await Synergy.bulkWrite(ops, { ordered: false });
        total += ops.length;
        ops.length = 0;
        process.stdout.write(`  ↳ ${total} synergies written...\r`);
      }
    }
  }

  if (ops.length > 0) {
    await Synergy.bulkWrite(ops, { ordered: false });
    total += ops.length;
  }

  console.log(`\n🎉 Synergy seeding complete! ${total} documents upserted`);
  console.log('⚠️  This is SYNTHETIC data — replace later with real duo win-rate data.');
}

seedSynergies()
  .catch((err) => {
    console.error('❌ Synergy seeding failed:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  });
