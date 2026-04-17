import { create } from 'zustand';

type Role = 'top' | 'jungle' | 'mid' | 'bot' | 'support';

interface TeamPicks {
  top: string | null;
  jungle: string | null;
  mid: string | null;
  bot: string | null;
  support: string | null;
}

interface DraftState {
  myRole: Role | null;
  bans: string[];
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
      newBans[index] = championId ?? '';
      return { bans: newBans.filter(Boolean) as string[] }; // keep only defined bans if any
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
      bans: [],
      enemyPicks: { ...initialTeamPicks },
      allyPicks: { ...initialTeamPicks },
    }),
}));
