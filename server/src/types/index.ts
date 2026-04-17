//Shared TypeScript types for DraftSense backend

export type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

//Champion

export interface IChampion {
  id: string;           //e.g. "Vi", "Zed" (Data Dragon key)
  name: string;         //e.g. "Vi", "Zed"
  title: string;        //e.g. "the Piltover Enforcer"
  imageUrl: string;     //full CDN URL to splash / square art
  splashUrl: string;
  roles: Role[];        //primary + secondary roles the champ can play
  tags: string[];       //Data Dragon tags: ["Fighter", "Tank"], etc.
}

//Matchup

export interface IMatchup {
  championId: string;   //e.g. "Vi"
  opponentId: string;   //e.g. "Hecarim"
  role: Role;
  winRate: number;      //0–1 (e.g. 0.53 = 53%)
  gamesPlayed: number;
  patch: string;        //e.g. "14.12"
}

//Synergy

export interface ISynergy {
  championId: string;
  allyId: string;
  winRate: number;      //duo win rate 0–1
  gamesPlayed: number;
  patch: string;
}

//Build

export interface IRune {
  id: number;         //Data Dragon rune ID (use to build icon CDN URL)
  key: string;        //e.g. "Electrocute"
  name: string;
  iconUrl: string;    //full CDN path for the rune icon
  description?: string;
}

export interface IRunePage {
  primaryTree: string;
  primaryTreeId: number;
  primary: IRune[];
  secondaryTree: string;
  secondaryTreeId: number;
  secondary: IRune[];
  shards: IRune[];    //stat shards (bottom row of rune page)
}

//Item with Data Dragon ID — frontend uses id to build CDN image URL:
//https://ddragon.leagueoflegends.com/cdn/{patch}/img/item/{id}.png
export interface IItem {
  id: number;
  name: string;
  iconUrl: string;
}

export interface IItemBuild {
  starter: IItem[];
  core: IItem[];
  situational: IItem[];
}

export interface IBuild {
  championId: string;
  role: Role;
  patch: string;
  runes: IRunePage;
  itemBuild: IItemBuild;
  skillOrder: string[];   //e.g. ["Q","W","E","Q","Q","R",...]
  tips: string[];
}

//API Request / Response types

export interface TeamPicks {
  top?: string | null;
  jungle?: string | null;
  mid?: string | null;
  bot?: string | null;
  support?: string | null;
}

export interface RecommendRequest {
  myRole: Role;
  bans: string[];
  enemyPicks: TeamPicks;
  allyPicks: TeamPicks;
}

export interface ScoredChampion {
  champion: IChampion;
  counterScore: number;
  synergyScore: number;
  overallScore: number;
  aiExplanation?: string;
}

export interface RecommendResponse {
  counterPicks: ScoredChampion[];
  synergyPicks: ScoredChampion[];
  overallBest: ScoredChampion[];
}

export interface BuildRequest {
  champion: string;
  role: Role;
  enemyPicks: TeamPicks;
}

export interface BuildResponse extends IBuild {
  aiNarration?: string;
}
