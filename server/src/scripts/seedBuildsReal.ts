/*
Real Build Seeder - Data Dragon Items + Runes
Fetches real item and rune data from Riot's Data Dragon CDN.
Assigns intelligent builds per champion based on their archetype and role.
Items and runes are stored with their Data Dragon IDs so the frontend
can render champion icons using the CDN URL pattern:
  https://ddragon.leagueoflegends.com/cdn/{patch}/img/item/{id}.png
  https://ddragon.leagueoflegends.com/cdn/img/{runeIconPath}

Run: npm run seed:builds:real
*/

import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import mongoose from 'mongoose';
import Champion from '../models/Champion';
import Build from '../models/Build';
import { Role, IItem, IRune } from '../types';

const MONGO_URI = process.env.MONGO_URI as string;
const PATCH_DISPLAY = '26.8';
const DD_BASE = 'https://ddragon.leagueoflegends.com';

//Interfaces for Data Dragon responses

interface DDItemEntry {
  name: string;
  description: string;
  tags: string[];
  gold: { base: number; purchasable: boolean; total: number; sell: number };
  into?: string[];
  from?: string[];
  image: { full: string };
}

interface DDRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: Array<{
    runes: Array<{
      id: number;
      key: string;
      icon: string;
      name: string;
      shortDesc: string;
    }>;
  }>;
}

interface ItemEntry extends IItem {
  tags: string[];
  cost: number;
  from: string[];
}

//Stat shard IDs and names (static — these rarely change)
const STAT_SHARDS: Record<string, IRune> = {
  adaptiveForce: { id: 5008, key: 'AdaptiveForce', name: 'Adaptive Force', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsAdaptiveForceIcon.png` },
  attackSpeed: { id: 5005, key: 'AttackSpeed', name: 'Attack Speed', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsAttackSpeedIcon.png` },
  abilityHaste: { id: 5007, key: 'AbilityHaste', name: 'Ability Haste', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsCDRScalingIcon.png` },
  armor: { id: 5002, key: 'Armor', name: 'Armor', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsArmorIcon.png` },
  magicResist: { id: 5003, key: 'MagicResist', name: 'Magic Resist', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsMagicResIcon.png` },
  health: { id: 5001, key: 'Health', name: '+15-90 HP', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsHealthScalingIcon.png` },
  tenacity: { id: 5010, key: 'Tenacity', name: 'Tenacity & Slow', iconUrl: `${DD_BASE}/cdn/img/perk-images/StatMods/StatModsTenacityIcon.png` },
};

//Data Dragon fetchers

async function getLatestPatch(): Promise<string> {
  const { data } = await axios.get<string[]>(`${DD_BASE}/api/versions.json`);
  return data[0];
}

async function fetchAndCategorizeItems(patch: string): Promise<{
  assassinAD: ItemEntry[];
  fighterAD: ItemEntry[];
  mageAP: ItemEntry[];
  marksman: ItemEntry[];
  tank: ItemEntry[];
  enchanter: ItemEntry[];
  tankSupport: ItemEntry[];
  jungleLegendary: ItemEntry[];
  starters: Record<string, ItemEntry>;
}> {
  const { data } = await axios.get(`${DD_BASE}/cdn/${patch}/data/en_US/item.json`);
  const rawItems = data.data as Record<string, DDItemEntry>;

  const categories = {
    assassinAD: [] as ItemEntry[],
    fighterAD: [] as ItemEntry[],
    mageAP: [] as ItemEntry[],
    marksman: [] as ItemEntry[],
    tank: [] as ItemEntry[],
    enchanter: [] as ItemEntry[],
    tankSupport: [] as ItemEntry[],
    jungleLegendary: [] as ItemEntry[],
    starters: {} as Record<string, ItemEntry>,
  };

  //Known starter item IDs (stable across patches)
  const STARTER_IDS: Record<string, string> = {
    '1055': 'doransBlade',
    '1056': 'doransRing',
    '1054': 'doransShield',
    '2003': 'healthPotion',
    '2031': 'refillablePotion',
    '1082': 'darkSeal',
  };

  for (const [idStr, item] of Object.entries(rawItems)) {
    const numId = parseInt(idStr);

    //Capture known starter items separately
    if (STARTER_IDS[idStr]) {
      categories.starters[STARTER_IDS[idStr]] = {
        id: numId,
        name: item.name,
        iconUrl: `${DD_BASE}/cdn/${patch}/img/item/${item.image.full}`,
        tags: item.tags,
        cost: item.gold.total,
        from: item.from ?? [],
      };
      continue;
    }

    //Skip items that don't belong in a main build slot
    if (!item.gold.purchasable) continue;
    if (item.tags.includes('Consumable')) continue;
    if (item.tags.includes('Vision')) continue;
    if (item.gold.total < 2000) continue; //Skip cheap components

    //Skip boots in main item slots (they're handled separately)
    if (item.tags.includes('Boots') && item.gold.total < 3200) continue;

    //Skip raw components (they build into something, and cost < 2500)
    const hasUpgrade = item.into && item.into.length > 0;
    if (hasUpgrade && item.gold.total < 2500) continue;

    const entry: ItemEntry = {
      id: numId,
      name: item.name,
      iconUrl: `${DD_BASE}/cdn/${patch}/img/item/${item.image.full}`,
      tags: item.tags,
      cost: item.gold.total,
      from: item.from ?? [],
    };

    const t = new Set(item.tags);

    //Jungle smite items (need to check for jungle tag)
    if (t.has('Jungle') && item.gold.total >= 2200) {
      categories.jungleLegendary.push(entry);
      continue;
    }

    //Categorize by dominant stat profile
    if (t.has('SpellDamage') && (t.has('Mana') || t.has('Cooldown') || t.has('Damage'))) {
      categories.mageAP.push(entry);
    } else if (t.has('SpellDamage')) {
      categories.mageAP.push(entry);
    } else if (t.has('CriticalStrike') && t.has('Damage')) {
      categories.marksman.push(entry);
      categories.assassinAD.push(entry);
    } else if (t.has('Damage') && t.has('Health') && !t.has('SpellDamage')) {
      categories.fighterAD.push(entry);
    } else if (t.has('Damage') && !t.has('Health') && !t.has('SpellDamage')) {
      categories.assassinAD.push(entry);
    } else if ((t.has('Armor') || t.has('SpellBlock')) && t.has('Health')) {
      categories.tank.push(entry);
      categories.tankSupport.push(entry);
    } else if (t.has('Health') && !t.has('Damage') && !t.has('SpellDamage')) {
      categories.tank.push(entry);
    } else if (t.has('Aura') || t.has('Heal') || (t.has('ManaRegen') && t.has('Cooldown'))) {
      categories.enchanter.push(entry);
    }
  }

  //Sort each list by cost descending
  for (const key of Object.keys(categories)) {
    if (key !== 'starters') {
      (categories as any)[key].sort((a: ItemEntry, b: ItemEntry) => b.cost - a.cost);
    }
  }

  return categories;
}

async function fetchRunes(patch: string): Promise<DDRune[]> {
  const { data } = await axios.get<DDRune[]>(`${DD_BASE}/cdn/${patch}/data/en_US/runesReforged.json`);
  return data;
}

//Rune helpers

function findTree(runes: DDRune[], treeName: string): DDRune | undefined {
  return runes.find((t) => t.key === treeName || t.name === treeName);
}

function getRune(tree: DDRune, slotIndex: number, runeKey: string): IRune | undefined {
  const slot = tree.slots[slotIndex];
  if (!slot) return undefined;
  const r = slot.runes.find((r) => r.key === runeKey);
  if (!r) return undefined;
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    iconUrl: `${DD_BASE}/cdn/img/${r.icon}`,
  };
}

function getSlotRune(tree: DDRune, slotIndex: number, position = 0): IRune {
  const slot = tree.slots[slotIndex];
  const r = slot?.runes[position] ?? slot?.runes[0];
  if (!r) return { id: 0, key: 'unknown', name: 'Unknown', iconUrl: '' };
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    iconUrl: `${DD_BASE}/cdn/img/${r.icon}`,
  };
}

//Archetype definitions (maps champion tags + role to build strategy)

type BuildStrategy = {
  itemCategory: keyof typeof STRATEGY_ITEM_MAP;
  primaryTree: string;
  keystone: string;  //rune key in slot 0
  secondaryTree: string;
  shards: (keyof typeof STAT_SHARDS)[];
};

const STRATEGY_ITEM_MAP = {
  assassinAD: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.assassinAD.slice(0, 3), situational: cats.assassinAD.slice(3, 6) }),
  fighterAD: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.fighterAD.slice(0, 3), situational: cats.fighterAD.slice(3, 6) }),
  mageAP: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.mageAP.slice(0, 3), situational: cats.mageAP.slice(3, 6) }),
  marksman: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.marksman.slice(0, 3), situational: cats.marksman.slice(3, 6) }),
  tank: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.tank.slice(0, 3), situational: cats.tank.slice(3, 6) }),
  enchanter: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.enchanter.slice(0, 3), situational: cats.enchanter.slice(3, 6) }),
  tankSupport: (cats: ReturnType<typeof buildCatProxy>) => ({ core: cats.tankSupport.slice(0, 3), situational: cats.tankSupport.slice(3, 6) }),
};

//Proxy type for category access in STRATEGY_ITEM_MAP
function buildCatProxy(cats: Awaited<ReturnType<typeof fetchAndCategorizeItems>>) {
  return {
    assassinAD: cats.assassinAD,
    fighterAD: cats.fighterAD,
    mageAP: cats.mageAP,
    marksman: cats.marksman,
    tank: cats.tank,
    enchanter: cats.enchanter,
    tankSupport: cats.tankSupport,
  };
}

//Strategy lookup: champion primary tag + role → build strategy
function getStrategy(tags: string[], role: Role): BuildStrategy {
  const tagSet = new Set(tags);

  //Role-specific overrides first
  if (role === 'bot' && tagSet.has('Marksman')) {
    return { itemCategory: 'marksman', primaryTree: 'Precision', keystone: 'LethalTempo', secondaryTree: 'Domination', shards: ['adaptiveForce', 'attackSpeed', 'armor'] };
  }
  if (role === 'support') {
    if (tagSet.has('Support') && !tagSet.has('Fighter') && !tagSet.has('Tank')) {
      return { itemCategory: 'enchanter', primaryTree: 'Sorcery', keystone: 'SummonAery', secondaryTree: 'Resolve', shards: ['adaptiveForce', 'armor', 'health'] };
    }
    return { itemCategory: 'tankSupport', primaryTree: 'Resolve', keystone: 'Aftershock', secondaryTree: 'Precision', shards: ['armor', 'armor', 'health'] };
  }

  //General archetype detection
  if (tagSet.has('Assassin')) {
    return { itemCategory: 'assassinAD', primaryTree: 'Domination', keystone: 'Electrocute', secondaryTree: 'Sorcery', shards: ['adaptiveForce', 'adaptiveForce', 'armor'] };
  }
  if (tagSet.has('Mage') && !tagSet.has('Fighter')) {
    return { itemCategory: 'mageAP', primaryTree: 'Sorcery', keystone: 'ArcaneComet', secondaryTree: 'Domination', shards: ['adaptiveForce', 'adaptiveForce', 'magicResist'] };
  }
  if (tagSet.has('Tank') && !tagSet.has('Fighter')) {
    return { itemCategory: 'tank', primaryTree: 'Resolve', keystone: 'GraspOfTheUndying', secondaryTree: 'Precision', shards: ['armor', 'armor', 'health'] };
  }
  if (tagSet.has('Marksman')) {
    return { itemCategory: 'marksman', primaryTree: 'Precision', keystone: 'LethalTempo', secondaryTree: 'Domination', shards: ['adaptiveForce', 'attackSpeed', 'armor'] };
  }

  //Default: Fighter
  return { itemCategory: 'fighterAD', primaryTree: 'Precision', keystone: 'Conqueror', secondaryTree: 'Resolve', shards: ['adaptiveForce', 'adaptiveForce', 'armor'] };
}

//Skill order generator by archetype
function getSkillOrder(tags: string[], role: Role): string[] {
  const tagSet = new Set(tags);
  if (tagSet.has('Assassin')) {
    return ['Q', 'E', 'Q', 'W', 'Q', 'R', 'Q', 'E', 'Q', 'E', 'R', 'E', 'E', 'W', 'W', 'R', 'W', 'W'];
  }
  if (tagSet.has('Mage')) {
    return ['Q', 'W', 'Q', 'E', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'];
  }
  if (tagSet.has('Marksman')) {
    return ['Q', 'W', 'Q', 'E', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'];
  }
  if (tagSet.has('Tank') && !tagSet.has('Fighter')) {
    return ['E', 'Q', 'E', 'W', 'E', 'R', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'Q', 'W', 'W', 'R', 'W', 'W'];
  }
  if (role === 'support') {
    return ['E', 'Q', 'E', 'W', 'E', 'R', 'E', 'Q', 'E', 'Q', 'R', 'Q', 'Q', 'W', 'W', 'R', 'W', 'W'];
  }
  //Fighter
  return ['Q', 'W', 'Q', 'E', 'Q', 'R', 'Q', 'W', 'Q', 'W', 'R', 'W', 'W', 'E', 'E', 'R', 'E', 'E'];
}

//Tips generator
function getTips(name: string, tags: string[], role: Role): string[] {
  const tagSet = new Set(tags);
  const archetype = tagSet.has('Assassin') ? 'burst assassin'
    : tagSet.has('Mage') ? 'mage'
      : tagSet.has('Tank') ? 'tank'
        : tagSet.has('Marksman') ? 'marksman'
          : 'fighter';

  return [
    `${name} plays as a ${archetype} in ${role} — focus on your core power spike after completing your first 2 items.`,
    `Track the enemy jungler position — ${name} is ${tagSet.has('Tank') ? 'durable but can be kited by mobile enemies' : 'mobile, use this to roam and create pressure'}.`,
    `Win condition: ${tagSet.has('Assassin') ? 'snowball with early kills and keep the enemy carry at 0 assists' : tagSet.has('Tank') ? 'engage teamfights, absorb damage, and peel for your carries' : tagSet.has('Mage') ? 'control the mid-game with poke and burst down isolated targets' : 'scale to late game and position well in teamfights'}.`,
  ];
}

//Build starter items based on archetype
function getStarters(
  tags: string[],
  role: Role,
  starters: Record<string, ItemEntry>
): IItem[] {
  const tagSet = new Set(tags);
  const pick = (key: string): IItem | undefined => {
    const s = starters[key];
    if (!s) return undefined;
    return { id: s.id, name: s.name, iconUrl: s.iconUrl };
  };

  if (role === 'support') {
    return [pick('doransShield') ?? { id: 1054, name: "Doran's Shield", iconUrl: '' }];
  }
  if (tagSet.has('Mage')) {
    return [pick('doransRing') ?? { id: 1056, name: "Doran's Ring", iconUrl: '' }, pick('healthPotion') ?? { id: 2003, name: 'Health Potion', iconUrl: '' }].filter(Boolean) as IItem[];
  }
  if (tagSet.has('Tank')) {
    return [pick('doransShield') ?? { id: 1054, name: "Doran's Shield", iconUrl: '' }, pick('healthPotion') ?? { id: 2003, name: 'Health Potion', iconUrl: '' }].filter(Boolean) as IItem[];
  }
  //AD/Fighter/Assassin/Marksman
  return [pick('doransBlade') ?? { id: 1055, name: "Doran's Blade", iconUrl: '' }, pick('healthPotion') ?? { id: 2003, name: 'Health Potion', iconUrl: '' }].filter(Boolean) as IItem[];
}

//Main

async function seedBuildsReal(): Promise<void> {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const patch = await getLatestPatch();
  console.log(`Fetching Data Dragon assets (patch ${patch})...`);

  const [cats, runeData] = await Promise.all([
    fetchAndCategorizeItems(patch),
    fetchRunes(patch),
  ]);

  console.log(`Items loaded:`);
  console.log(`  Assassin AD: ${cats.assassinAD.length}`);
  console.log(`  Fighter AD:  ${cats.fighterAD.length}`);
  console.log(`  Mage AP:     ${cats.mageAP.length}`);
  console.log(`  Marksman:    ${cats.marksman.length}`);
  console.log(`  Tank:        ${cats.tank.length}`);
  console.log(`  Enchanter:   ${cats.enchanter.length}`);
  console.log(`Rune trees loaded: ${runeData.map(r => r.name).join(', ')}`);

  const champions = await Champion.find().lean();
  console.log(`Loaded ${champions.length} champions`);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];
  let total = 0;
  const ops: mongoose.AnyBulkWriteOperation<any>[] = [];
  const proxy = buildCatProxy(cats);

  for (const champ of champions) {
    for (const role of roles) {
      const strategy = getStrategy(champ.tags, role);

      //Resolve rune tree
      const primaryTree = findTree(runeData, strategy.primaryTree);
      const secondaryTree = findTree(runeData, strategy.secondaryTree);

      if (!primaryTree || !secondaryTree) {
        console.warn(`  Rune tree not found for ${strategy.primaryTree}/${strategy.secondaryTree}`);
        continue;
      }

      //Build rune page — keystone (slot 0), then 3 sub-runes (slots 1–3) for primary
      const keystone = getRune(primaryTree, 0, strategy.keystone) ?? getSlotRune(primaryTree, 0);
      const pRune1 = getSlotRune(primaryTree, 1);
      const pRune2 = getSlotRune(primaryTree, 2);
      const pRune3 = getSlotRune(primaryTree, 3);

      //Secondary: pick one rune from 2 different slots
      const sRune1 = getSlotRune(secondaryTree, 1);
      const sRune2 = getSlotRune(secondaryTree, 2);

      const shards: IRune[] = strategy.shards.map((key) => STAT_SHARDS[key]);

      //Resolve items
      const categoryItems = STRATEGY_ITEM_MAP[strategy.itemCategory](proxy);
      const starterItems = getStarters(champ.tags, role, cats.starters);

      const coreItems: IItem[] = categoryItems.core.map((i) => ({
        id: i.id, name: i.name, iconUrl: i.iconUrl,
      }));
      const situationalItems: IItem[] = categoryItems.situational.map((i) => ({
        id: i.id, name: i.name, iconUrl: i.iconUrl,
      }));

      ops.push({
        updateOne: {
          filter: { championId: champ.championId, role },
          update: {
            $set: {
              championId: champ.championId,
              role,
              patch: PATCH_DISPLAY,
              runes: {
                primaryTree: primaryTree.name,
                primaryTreeId: primaryTree.id,
                primary: [keystone, pRune1, pRune2, pRune3],
                secondaryTree: secondaryTree.name,
                secondaryTreeId: secondaryTree.id,
                secondary: [sRune1, sRune2],
                shards,
              },
              itemBuild: {
                starter: starterItems,
                core: coreItems,
                situational: situationalItems,
              },
              skillOrder: getSkillOrder(champ.tags, role),
              tips: getTips(champ.name, champ.tags, role),
            },
          },
          upsert: true,
        },
      });

      if (ops.length >= 500) {
        await Build.bulkWrite(ops, { ordered: false });
        total += ops.length;
        ops.length = 0;
        process.stdout.write(`  ${total} builds written...\r`);
      }
    }
  }

  if (ops.length > 0) {
    await Build.bulkWrite(ops, { ordered: false });
    total += ops.length;
  }

  console.log(`\nBuild seeding complete! ${total} documents upserted`);
  console.log(`Items stored with Data Dragon IDs — frontend can render images via:`);
  console.log(`  ${DD_BASE}/cdn/${patch}/img/item/{id}.png`);
}

seedBuildsReal()
  .catch((err) => {
    console.error('Build seeding failed:', err);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('Disconnected');
    process.exit(0);
  });
