/*
Build Seeder — Template builds per champion type

Generates placeholder build data from Data Dragon rune + item data.
These are TEMPLATE builds by champion archetype (Assassin, Tank, etc.)
NOT per-champion optimised builds.

For real per-champion builds: use U.GG or Mobafire APIs / scraping.
Run: npm run seed:builds
*/

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import mongoose from 'mongoose';
import Champion from '../models/Champion';
import Build from '../models/Build';
import { Role } from '../types';

const MONGO_URI = process.env.MONGO_URI as string;
const PATCH_DISPLAY = '26.8';
const DATA_DRAGON_BASE = 'https://ddragon.leagueoflegends.com';

//Fetch latest Data Dragon patch
async function getLatestDDPatch(): Promise<string> {
  const { data } = await axios.get<string[]>(`${DATA_DRAGON_BASE}/api/versions.json`);
  return data[0];
}

//Template builds by primary tag
/*Items are stored as display names - replace with actual item IDs from Data Dragon
if you need to render item images in the frontend*/

const BUILDS_BY_TAG: Record<string, {
  runes: { primaryTree: string; primary: string[]; secondaryTree: string; secondary: string[]; shards: string[] };
  itemBuild: { starter: string[]; core: string[]; situational: string[] };
  skillOrder: string[];
}> = {
  Assassin: {
    runes: {
      primaryTree: 'Domination',
      primary: ['Electrocute', 'Sudden Impact', 'Eyeball Collection', "Treasure Hunter"],
      secondaryTree: 'Sorcery',
      secondary: ['Absolute Focus', 'Gathering Storm'],
      shards: ['Adaptive Force', 'Adaptive Force', 'Magic Resist'],
    },
    itemBuild: {
      starter: ['Long Sword', 'Health Potion'],
      core: ['Youmuu\'s Ghostblade', 'Hubris', 'Edge of Night'],
      situational: ['Serpent\'s Fang', 'Serylda\'s Grudge', 'Shadowflame'],
    },
    skillOrder: ['Q', 'E', 'Q', 'W', 'Q', 'R', 'Q', 'E', 'Q', 'E', 'R', 'E', 'E', 'W', 'W', 'R', 'W', 'W'],
  },
  Fighter: {
    runes: {
      primaryTree: 'Precision',
      primary: ['Conqueror', 'Triumph', 'Legend: Alacrity', 'Last Stand'],
      secondaryTree: 'Resolve',
      secondary: ['Second Wind', 'Unflinching'],
      shards: ['Adaptive Force', 'Adaptive Force', 'Armor'],
    },
    itemBuild: {
      starter: ['Doran\'s Blade', 'Health Potion'],
      core: ['Trinity Force', 'Sterak\'s Gage', 'Black Cleaver'],
      situational: ['Death\'s Dance', 'Maw of Malmortius', 'Sundered Sky'],
    },
    skillOrder: ['Q', 'W', 'Q', 'E', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'],
  },
  Mage: {
    runes: {
      primaryTree: 'Sorcery',
      primary: ['Arcane Comet', 'Manaflow Band', 'Transcendence', 'Scorch'],
      secondaryTree: 'Domination',
      secondary: ['Taste of Blood', 'Ravenous Hunter'],
      shards: ['Adaptive Force', 'Adaptive Force', 'Magic Resist'],
    },
    itemBuild: {
      starter: ['Doran\'s Ring', 'Health Potion'],
      core: ['Shadowflame', 'Malignance', 'Rabadon\'s Deathcap'],
      situational: ['Zhonya\'s Hourglass', 'Void Staff', 'Horizon Focus'],
    },
    skillOrder: ['Q', 'E', 'Q', 'W', 'Q', 'R', 'Q', 'E', 'Q', 'E', 'R', 'E', 'E', 'W', 'W', 'R', 'W', 'W'],
  },
  Marksman: {
    runes: {
      primaryTree: 'Precision',
      primary: ['Lethal Tempo', 'Presence of Mind', 'Legend: Alacrity', 'Cut Down'],
      secondaryTree: 'Domination',
      secondary: ['Taste of Blood', 'Treasure Hunter'],
      shards: ['Adaptive Force', 'Attack Speed', 'Armor'],
    },
    itemBuild: {
      starter: ['Doran\'s Blade', 'Health Potion'],
      core: ['Kraken Slayer', 'Galeforce', 'Infinity Edge'],
      situational: ['Lord Dominik\'s Regards', 'Mortal Reminder', 'The Collector'],
    },
    skillOrder: ['Q', 'W', 'Q', 'E', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'],
  },
  Tank: {
    runes: {
      primaryTree: 'Resolve',
      primary: ['Grasp of the Undying', 'Shield Bash', 'Conditioning', 'Overgrowth'],
      secondaryTree: 'Precision',
      secondary: ['Triumph', 'Legend: Tenacity'],
      shards: ['Armor', 'Armor', 'Health'],
    },
    itemBuild: {
      starter: ['Doran\'s Shield', 'Health Potion'],
      core: ['Sunfire Aegis', 'Thornmail', 'Heartsteel'],
      situational: ['Gargoyle Stoneplate', 'Warmog\'s Armor', 'Frozen Heart'],
    },
    skillOrder: ['E', 'W', 'E', 'Q', 'E', 'R', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'Q', 'W', 'W', 'R', 'W', 'W'],
  },
  Support: {
    runes: {
      primaryTree: 'Resolve',
      primary: ['Arcane Comet', 'Font of Life', 'Conditioning', 'Revitalize'],
      secondaryTree: 'Sorcery',
      secondary: ['Manaflow Band', 'Transcendence'],
      shards: ['Adaptive Force', 'Armor', 'Health'],
    },
    itemBuild: {
      starter: ['Spellthief\'s Edge', 'Health Potion'],
      core: ['Moonstone Renewer', 'Staff of Flowing Water', 'Redemption'],
      situational: ['Ardent Censer', 'Mikael\'s Blessing', 'Locket of the Iron Solari'],
    },
    skillOrder: ['E', 'Q', 'E', 'W', 'E', 'R', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'Q', 'W', 'W', 'R', 'W', 'W'],
  },
};

const ROLE_DEFAULT_TAG: Record<Role, string> = {
  top: 'Fighter',
  jungle: 'Fighter',
  mid: 'Mage',
  bot: 'Marksman',
  support: 'Support',
};

function getRoleTag(tags: string[], role: Role): string {
  const priority = Object.keys(BUILDS_BY_TAG);
  const match = priority.find((t) => tags.includes(t));
  return match ?? ROLE_DEFAULT_TAG[role];
}

function makeTips(champName: string, role: Role, tags: string[]): string[] {
  return [
    `Focus ${tags.includes('Assassin') ? 'burst combo' : 'sustained pressure'} as ${champName} in ${role}.`,
    `Track enemy jungler position — ${champName} is ${tags.includes('Tank') ? 'durable but easy to kite long-term' : 'mobile and hard to pin down'}.`,
    `Win condition: ${tags.includes('Assassin') ? 'snowball leads and assassinate carries' : tags.includes('Tank') ? 'engage teamfights and protect your carries' : 'farm safely, scale, and carry late game'}.`,
  ];
}

//Main

async function seedBuilds(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const champions = await Champion.find().lean();
  console.log(`Loaded ${champions.length} champions`);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];
  let total = 0;
  const ops: mongoose.AnyBulkWriteOperation<any>[] = [];

  for (const champ of champions) {
    for (const role of roles) {
      const tagKey = getRoleTag(champ.tags, role);
      const template = BUILDS_BY_TAG[tagKey];
      if (!template) continue;

      const runeTemplate = template.runes;

      ops.push({
        updateOne: {
          filter: { championId: champ.championId, role },
          update: {
            $set: {
              championId: champ.championId,
              role,
              patch: PATCH_DISPLAY,
              runes: {
                primaryTree: runeTemplate.primaryTree,
                primary: runeTemplate.primary.map((name) => ({ name })),
                secondaryTree: runeTemplate.secondaryTree,
                secondary: runeTemplate.secondary.map((name) => ({ name })),
                shards: runeTemplate.shards.map((name) => ({ name })),
              },
              itemBuild: template.itemBuild,
              skillOrder: template.skillOrder,
              tips: makeTips(champ.name, role, champ.tags),
            },
          },
          upsert: true,
        },
      });
    }

    if (ops.length >= 500) {
      await Build.bulkWrite(ops, { ordered: false });
      total += ops.length;
      ops.length = 0;
      process.stdout.write(`  ↳ ${total} builds written...\r`);
    }
  }

  if (ops.length > 0) {
    await Build.bulkWrite(ops, { ordered: false });
    total += ops.length;
  }

  console.log(`\nBuild seeding complete! ${total} documents upserted`);
  console.log('These are TEMPLATE builds by champion archetype.');
  console.log('For per-champion real builds, consider U.GG or Mobafire scraping.');
}

seedBuilds()
  .catch((err) => {
    console.error('Build seeding failed:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  });
