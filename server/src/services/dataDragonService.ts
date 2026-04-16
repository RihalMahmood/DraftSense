import axios from 'axios';
import Champion from '../models/Champion';
import { Role } from '../types';

const DATA_DRAGON_BASE = 'https://ddragon.leagueoflegends.com';

//Map Data Dragon tags to internal roles (approximate)
const tagToRoles: Record<string, Role[]> = {
  Fighter: ['top', 'jungle'],
  Tank: ['top', 'support'],
  Mage: ['mid', 'bot', 'support'],
  Assassin: ['mid', 'jungle'],
  Marksman: ['bot'],
  Support: ['support'],
};

function resolveRoles(tags: string[]): Role[] {
  const roleSet = new Set<Role>();
  for (const tag of tags) {
    const mapped = tagToRoles[tag] ?? [];
    mapped.forEach((r) => roleSet.add(r));
  }
  //Default to all roles if nothing mapped
  if (roleSet.size === 0) {
    (['top', 'jungle', 'mid', 'bot', 'support'] as Role[]).forEach((r) =>
      roleSet.add(r)
    );
  }
  return Array.from(roleSet);
}

export const getLatestPatch = async (): Promise<string> => {
  const { data } = await axios.get<string[]>(
    `${DATA_DRAGON_BASE}/api/versions.json`
  );
  return data[0];   //e.g. "14.12.1"
};

export const fetchAndSeedChampions = async (): Promise<void> => {
  const patch = await getLatestPatch();
  console.log(`Fetching champion data from Data Dragon (patch ${patch})...`);

  const { data } = await axios.get(
    `${DATA_DRAGON_BASE}/cdn/${patch}/data/en_US/champion.json`
  );

  const championsData = Object.values(data.data as Record<string, any>).map(
    (champ: any) => ({
      championId: champ.id as string,
      name: champ.name as string,
      title: champ.title as string,
      imageUrl: `${DATA_DRAGON_BASE}/cdn/${patch}/img/champion/${champ.image.full}`,
      splashUrl: `${DATA_DRAGON_BASE}/cdn/img/champion/splash/${champ.id}_0.jpg`,
      roles: resolveRoles(champ.tags as string[]),
      tags: champ.tags as string[],
    })
  );

  let upserted = 0;
  for (const champ of championsData) {
    await Champion.findOneAndUpdate(
      { championId: champ.championId },
      { $set: champ },
      { upsert: true, new: true }
    );
    upserted++;
  }

  console.log(`Seeded ${upserted} champions (patch ${patch})`);
};
