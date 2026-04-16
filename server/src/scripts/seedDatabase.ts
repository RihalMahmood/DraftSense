/*
Database Seeding Script
Run with: npm run seed

What it does:
1. Fetches all champions from Riot Data Dragon (current patch)
2. Upserts them into the `champions` collection
Matchup & synergy data requires a separate data source
*/

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { fetchAndSeedChampions } from '../services/dataDragonService';

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in .env');
  process.exit(1);
}

const run = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected');

    await fetchAndSeedChampions();

    console.log('\nSeeding complete!');
    console.log(
      'Next step: populate `matchups` and `synergies` collections'
    );
    console.log(
      'See PROJECT_PLAN.md → Data Sources section for options.'
    );
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

run();
