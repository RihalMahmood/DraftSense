import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { BanRow } from '../components/draft/BanRow';
import { TeamColumn } from '../components/draft/TeamColumn';
import { ChampionSearch } from '../components/common/ChampionSearch';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { Champion, Role, TeamPicks } from '../types';

type SearchTarget =
  | { type: 'ban'; index: number }
  | { type: 'pick'; role: Role; side: 'blue' | 'red' }
  | null;

export const DraftInputPage: FC = () => {
  const navigate = useNavigate();
  const myRole = useDraftStore(state => state.myRole);
  const { setBan, setAllyPick, setEnemyPick, bans, allyPicks, enemyPicks } = useDraftStore();

  const [championsMeta, setChampionsMeta] = useState<Record<string, Champion>>({});
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(null);

  useEffect(() => {
    if (!myRole) {
      navigate('/');
    }

    const fetchChamps = async () => {
      try {
        const { data } = await apiClient.get<Champion[]>('/champions');
        const meta = data.reduce((acc, c: Champion) => ({ ...acc, [c.id]: c }), {});
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

  //Helper to count non-null picks
  const countPicks = (picks: TeamPicks) =>
    Object.values(picks).filter(p => p !== null && p !== '').length;

  const allyCount = countPicks(allyPicks);
  const enemyCount = countPicks(enemyPicks);
  const banCount = bans.filter(b => b && b !== '').length;

  return (
    <div className="text-on-surface min-h-screen flex flex-col overflow-x-hidden relative bg-[#030B17]">
      {/*Background gradients inline with Stitch*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 hex-overlay opacity-30"></div>
      </div>

      {/*TopAppBar*/}
      <header className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-8 bg-[#0a1420] shadow-[0px_0px_32px_rgba(3,11,23,0.4)] bg-gradient-to-b from-[#f0bf5c]/10 to-transparent">
        <div className="text-2xl font-bold text-[#f0bf5c] tracking-[0.05em] font-newsreader uppercase w-1/4">
          SOVEREIGN TACTICS
        </div>
        <nav className="flex-1 flex justify-center">
          <a className="text-[#f0bf5c] border-b-2 border-[#f0bf5c] pb-1 font-newsreader tracking-[0.05em] uppercase text-sm" href="#">LIVE DRAFT</a>
        </nav>
        <div className="flex items-center gap-4 w-1/4 justify-end">
          <span className="material-symbols-outlined text-[#45ddfd]/60 cursor-pointer hover:bg-[#f0bf5c]/5 p-2 transition-all" data-icon="settings">settings</span>
          <span className="material-symbols-outlined text-[#45ddfd]/60 cursor-pointer hover:bg-[#f0bf5c]/5 p-2 transition-all" data-icon="help">help</span>
        </div>
      </header>

      {/*Main Content Area*/}
      <main className="mt-16 p-8 flex-1 flex flex-col gap-8 relative mb-32 z-10 w-full max-w-6xl mx-auto">
        {/*Zone 1: Bans Bar*/}
        <section className="w-full flex items-center justify-center gap-4">
          <BanRow
            championsMeta={championsMeta}
            onBanClick={(index) => setSearchTarget({ type: 'ban', index })}
          />
        </section>

        {/*Zone 2: Teams*/}
        <section className="flex-1 grid grid-cols-2 gap-1 relative w-full">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#45ddfd] via-[#f0bf5c] to-[#ff7876] -translate-x-1/2 shadow-[0_0_20px_rgba(240,191,92,0.5)] z-10"></div>

          <TeamColumn
            side="blue"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'blue' })}
          />

          <TeamColumn
            side="red"
            championsMeta={championsMeta}
            onPickClick={(role) => setSearchTarget({ type: 'pick', role, side: 'red' })}
          />
        </section>

        {/*Champion Modal Overlay*/}
        {searchTarget && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030B17]/80 backdrop-blur-sm p-12 -mx-8 -my-8 h-[calc(100vh-64px)]">
            <div className="w-full max-w-4xl bg-surface-container border border-primary/20 relative shadow-2xl overflow-hidden flex flex-col h-[700px]">
              <div className="bracket-tl"></div>
              <div className="bracket-tr"></div>
              <div className="bracket-bl"></div>
              <div className="bracket-br"></div>
              <div className="p-6 border-b border-primary/10 flex justify-between items-center z-10">
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
              <div className="p-6 flex-1 overflow-hidden z-10">
                {/*Embedded Champion Search*/}
                <ChampionSearch
                  onSelect={handleSelectChampion}
                  onClose={() => setSearchTarget(null)}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/*Fixed Bottom Footer for Action*/}
      <footer className="fixed bottom-0 w-full z-50 h-28 backdrop-blur-md flex justify-center items-center px-10 bg-[#0a1420]/95 border-t border-[#f0bf5c]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-3">
          <button
            className="bg-gradient-to-r from-[#f0bf5c] to-[#c89b3c] text-[#0a1420] px-16 py-4 font-newsreader font-bold text-xl tracking-widest flex items-center gap-3 hover:brightness-110 hover:shadow-[0_0_20px_rgba(240,191,92,0.4)] active:scale-95 transition-all"
            style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
            onClick={() => navigate('/recommendations')}
          >
            <span className="material-symbols-outlined">magic_button</span>
            INITIALIZE ANALYSIS
          </button>
          <div className="font-sora text-[10px] tracking-widest text-[#f0bf5c]/60 font-bold uppercase">
            Enemy picks: {enemyCount}/5 • Ally picks: {allyCount}/5 • Bans: {banCount}/10
          </div>
        </div>
      </footer>
    </div>
  );
};
