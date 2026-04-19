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
  const state = useDraftStore();

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
    setSearchTarget(null);
  };

  return (
    <div className="min-h-screen w-full bg-background relative flex flex-col">
      {/*Fixed Top Navigation Bar*/}
      <header className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-8 bg-[#0a1420] shadow-[0px_0px_32px_rgba(3,11,23,0.4)] bg-linear-to-b from-primary/10 to-transparent">
        <div className="text-2xl font-bold text-primary tracking-widest font-newsreader uppercase">
          TACTICAL ADVISOR
        </div>
        <nav className="hidden md:flex gap-8">
          <a className="text-primary border-b-2 border-primary pb-1 font-newsreader tracking-widest uppercase text-sm" href="#">LIVE DRAFT</a>
          <a className="text-secondary/60 hover:text-secondary font-newsreader tracking-widest uppercase text-sm transition-all duration-300" href="#">HISTORY</a>
          <a className="text-secondary/60 hover:text-secondary font-newsreader tracking-widest uppercase text-sm transition-all duration-300" href="#">STRATEGY</a>
          <a className="text-secondary/60 hover:text-secondary font-newsreader tracking-widest uppercase text-sm transition-all duration-300" href="#">ACADEMY</a>
        </nav>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary/60 cursor-pointer hover:bg-primary/5 p-2 transition-all">settings</span>
          <span className="material-symbols-outlined text-secondary/60 cursor-pointer hover:bg-primary/5 p-2 transition-all">help</span>
        </div>
      </header>

      {/*Fixed Sidebar*/}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#0a1420] border-r border-primary/10 flex flex-col h-full py-6 z-40 md:flex">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">account_circle</span>
            </div>
            <div>
              <div className="text-xl font-newsreader text-primary leading-tight">STRATEGIST</div>
              <div className="text-[10px] tracking-widest text-secondary/60 sora uppercase">MASTER TIER</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-4 px-6 py-4 bg-linear-to-r from-primary/20 to-transparent border-l-4 border-primary text-primary font-bold transition-colors">
            <span className="material-symbols-outlined" data-icon="gavel">gavel</span>
            <span className="font-inter text-sm tracking-wider">Draft Phase</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 text-secondary/40 hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer">
            <span className="material-symbols-outlined" data-icon="analytics">analytics</span>
            <span className="font-inter text-sm tracking-wider">Matchup Data</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 text-secondary/40 hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer">
            <span className="material-symbols-outlined" data-icon="swords">swords</span>
            <span className="font-inter text-sm tracking-wider">Counter Picks</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 text-secondary/40 hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="font-inter text-sm tracking-wider">Team Synergy</span>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 text-secondary/40 hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer">
            <span className="material-symbols-outlined" data-icon="military_tech">military_tech</span>
            <span className="font-inter text-sm tracking-wider">Final Build</span>
          </div>
        </div>
        <div className="p-6">
          <button className="w-full py-3 bg-primary text-[#0a1420] sora font-bold tracking-tighter uppercase text-xs active:scale-95 transition-transform hover:brightness-110">
            LOCK SELECTION
          </button>
        </div>
      </aside>

      {/*Main Content Area*/}
      <main className="mt-16 ml-0 md:ml-64 p-8 flex-1 flex flex-col gap-8 relative hex-overlay">
        {/*Zone 1: Bans Bar*/}
        <section className="w-full flex items-center justify-center gap-4">
          <BanRow
            championsMeta={championsMeta}
            onBanClick={(index) => setSearchTarget({ type: 'ban', index })}
          />
        </section>

        {/*Zone 2: Teams*/}
        <section className="flex-1 grid grid-cols-2 gap-1 relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-linear-to-b from-secondary via-primary to-tertiary -translate-x-1/2 shadow-[0_0_20px_rgba(240,191,92,0.5)] z-10"></div>
          
          {/*Your Team*/}
          <TeamColumn
            side="blue"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'blue' })}
          />

          {/*Enemy Team*/}
          <TeamColumn
            side="red"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'red' })}
          />
        </section>

        {/*Champion Modal Overlay*/}
        {searchTarget && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-sm p-12">
            <div className="w-full max-w-4xl bg-surface-container border border-primary/20 relative shadow-2xl overflow-hidden flex flex-col">
              <div className="bracket-tl"></div>
              <div className="bracket-tr"></div>
              <div className="bracket-bl"></div>
              <div className="bracket-br"></div>
              <div className="p-6 border-b border-primary/10 flex justify-between items-center">
                <h2 className="text-2xl font-newsreader text-primary tracking-widest uppercase">
                  SELECT CHAMPION
                </h2>
                <button
                  onClick={() => setSearchTarget(null)}
                  className="text-secondary/60 hover:text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6">
                <ChampionSearch
                  onSelect={handleSelectChampion}
                  onClose={() => setSearchTarget(null)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/*Fixed Bottom Navigation Bar*/}
      <footer className="fixed bottom-0 w-full z-50 h-24 backdrop-blur-md flex justify-center items-center px-10 bg-[#0a1420]/95 border-t border-primary/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => navigate('/recommendations')}
            className="bg-linear-to-r from-primary to-primary-container text-[#0a1420] px-12 py-3 clip-path-polygon font-newsreader font-bold text-lg tracking-widest flex items-center gap-3 hover:brightness-110 hover:shadow-[0_0_20px_rgba(240,191,92,0.4)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">magic_button</span>
            GET RECOMMENDATION
          </button>
          <div className="sora text-[10px] tracking-widest text-primary/60 font-bold uppercase">
            Enemy picks: {Object.values(state.enemyPicks).filter(Boolean).length}/5 • Ally picks: {Object.values(state.allyPicks).filter(Boolean).length}/5 • Bans: {state.bans.filter(Boolean).length}/10
          </div>
        </div>
      </footer>
    </div>
  );
};
