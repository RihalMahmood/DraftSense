export interface Champion {
  id: string;
  name: string;
  image: string;  //The short filename like "Aatrox.png"
  roles: string[];
}

export type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

//Matches the backend Recommendation response
export interface RecommendationResponse {
  counterPicks: Champion[];
  synergyPicks: Champion[];
  overallBest: Champion[];
}

export interface BuildResponse {
  runes: {
    primary: { path: string; keystones: string[] };
    secondary: { path: string; keystones: string[] };
  };
  itemBuild: {
    starter: string[];
    core: string[];
    situational: string[];
  };
  skillOrder: string[];
  tips: string[];
}
