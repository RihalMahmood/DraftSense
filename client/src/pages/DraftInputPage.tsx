import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { BanRow } from '../components/draft/BanRow';
import { TeamColumn } from '../components/draft/TeamColumn';
import { ChampionSearch } from '../components/common/ChampionSearch';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { Champion, Role } from '../types';

type SearchTarget =
  | { type: 'ban'; index: number }
  | { type: 'pick'; role: Role; side: 'blue' | 'red' }
  | null;

export const DraftInputPage: FC = () => {
  const navigate = useNavigate();
  const myRole = useDraftStore(state => state.myRole);
  const { setBan, setAllyPick, setEnemyPick } = useDraftStore();

  const [championsMeta, setChampionsMeta] = useState<Record<string, Champion>>({});
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(null);

  useEffect(() => {
    if (!myRole) {
      navigate('/');
    }

    const fetchChamps = async () => {
      try {
        const { data } = await apiClient.get<Champion[]>('/champions');
        const meta = data.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
        setChampionsMeta(meta);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChamps();
  }, [myRole, navigate]);

  const handleSelectChampion = (championId: string) => {
    if (!searchTarget) return;

    if (searchTarget.type === 'ban') {
      setBan(searchTarget.index, championId);
    } else if (searchTarget.type === 'pick') {
      if (searchTarget.side === 'blue') {
        setAllyPick(searchTarget.role, championId);
      } else {
        setEnemyPick(searchTarget.role, championId);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 items-center bg-[url('/bg-texture.png')] bg-cover bg-fixed">
      {/*Background treatment*/}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0BC4E3 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="fixed inset-0 bg-background/80 pointer-events-none"></div>

      <div className="z-10 w-full max-w-6xl mt-4">

        {/*Header*/}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-surface-container-highest">
          <div>
            <h1 className="text-3xl font-display text-primary uppercase tracking-[0.15em]">Tactical Board</h1>
            <p className="text-sm text-surface-container-highest tracking-widest mt-1">YOUR ASSIGNMENT: {myRole?.toUpperCase()}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs tracking-widest uppercase text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Abort / Reselect
          </button>
        </div>

        {/*Bans Layout*/}
        <BanRow
          championsMeta={championsMeta}
          onBanClick={(index) => setSearchTarget({ type: 'ban', index })}
        />

        {/*Teams Layout*/}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-12 w-full">
          <TeamColumn
            side="blue"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'blue' })}
          />

          <div className="hidden md:flex flex-1 flex-col items-center justify-center opacity-20 py-20 pointer-events-none">
            {/*Decorative vs symbol*/}
            <div className="w-px h-32 bg-surface-container-highest mb-4"></div>
            <span className="font-display text-4xl text-surface-container-highest uppercase">VS</span>
            <div className="w-px h-32 bg-surface-container-highest mt-4"></div>
          </div>

          <TeamColumn
            side="red"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'red' })}
          />
        </div>

        {/*Action Button*/}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => navigate('/recommendations')}
            className="btn-sovereign text-xl"
          >
            INITIALIZE ANALYSIS
          </button>
        </div>
      </div>

      {searchTarget && (
        <ChampionSearch
          onSelect={handleSelectChampion}
          onClose={() => setSearchTarget(null)}
        />
      )}
    </div>
  );
};
