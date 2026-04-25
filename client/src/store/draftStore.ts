import { create } from 'zustand';
import type { Role, TeamPicks } from '../types';

interface DraftState {
  myRole: Role | null;
  bans: (string | null)[];    //Array of 10 bans (5 per team)
  enemyPicks: TeamPicks;
  allyPicks: TeamPicks;
  setMyRole: (role: Role) => void;
  setBan: (index: number, championId: string | null) => void;
  setEnemyPick: (role: Role, championId: string | null) => void;
  setAllyPick: (role: Role, championId: string | null) => void;
  resetDraft: () => void;
}

const initialTeamPicks: TeamPicks = {
  top: null,
  jungle: null,
  mid: null,
  bot: null,
  support: null,
};

export const useDraftStore = create<DraftState>((set) => ({
  myRole: null,
  bans: Array(10).fill(null),
  enemyPicks: { ...initialTeamPicks },
  allyPicks: { ...initialTeamPicks },

  setMyRole: (role) => set({ myRole: role }),

  setBan: (index, championId) =>
    set((state) => {
      const newBans = [...state.bans];
      newBans[index] = championId ?? null;
      return { bans: newBans };
    }),

  setEnemyPick: (role, championId) =>
    set((state) => ({
      enemyPicks: { ...state.enemyPicks, [role]: championId },
    })),

  setAllyPick: (role, championId) =>
    set((state) => ({
      allyPicks: { ...state.allyPicks, [role]: championId },
    })),

  resetDraft: () =>
    set({
      myRole: null,
      bans: Array(10).fill(null),
      enemyPicks: { ...initialTeamPicks },
      allyPicks: { ...initialTeamPicks },
    }),
}));
