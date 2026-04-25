import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { BanRow } from '../components/draft/BanRow';
import { TeamColumn } from '../components/draft/TeamColumn';
import { ChampionSearch } from '../components/common/ChampionSearch';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { Champion, Role, TeamPicks } from '../types';
import { AnalysisButton } from '../components/draft/AnalysisButton';

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
      const isBlue = searchTarget.index < 5;
      const start = isBlue ? 0 : 5;
      const sideBans = bans.slice(start, start + 5);
      const alreadyBannedInSide = sideBans.some((b, i) => b === championId && (start + i) !== searchTarget.index);
      if (alreadyBannedInSide) {
        window.alert('This champion is already banned by your team in another slot.');
        return;
      }
      setBan(searchTarget.index, championId);
    } else if (searchTarget.type === 'pick') {
      //Disallow picking a banned champion
      if (bans.some(b => b === championId)) {
        window.alert('Cannot pick a champion that is banned.');
        return;
      }

      //Disallow duplicate picks across both teams (allow keeping the same champ in the current slot)
      const currentSlotChamp = searchTarget.side === 'blue' ? allyPicks[searchTarget.role] : enemyPicks[searchTarget.role];
      const allPicked = [...Object.values(allyPicks), ...Object.values(enemyPicks)];
      const alreadyPickedElsewhere = allPicked.some(p => p === championId && p !== currentSlotChamp);
      if (alreadyPickedElsewhere) {
        window.alert('This champion is already picked in another slot.');
        return;
      }

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
                  isDisabled={(championId: string) => {
                    if (!searchTarget) return false;

                    if (searchTarget.type === 'pick') {
                      //cannot pick if banned anywhere
                      if (bans.some(b => b === championId)) return true;

                      //cannot pick if already picked elsewhere (allow current slot's existing champ)
                      const currentSlotChamp = searchTarget.side === 'blue' ? allyPicks[searchTarget.role] : enemyPicks[searchTarget.role];
                      const allPicked = [...Object.values(allyPicks), ...Object.values(enemyPicks)].filter(Boolean) as string[];
                      const pickedSet = new Set(allPicked);
                      if (currentSlotChamp) pickedSet.delete(currentSlotChamp);
                      return pickedSet.has(championId);
                    }

                    if (searchTarget.type === 'ban') {
                      const isBlue = searchTarget.index < 5;
                      const start = isBlue ? 0 : 5;
                      const sideBans = bans.slice(start, start + 5).filter(Boolean) as string[];
                      const currentBan = bans[searchTarget.index];
                      return sideBans.includes(championId) && championId !== currentBan;
                    }

                    return false;
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      {/*Fixed Bottom Footer for Action & Status*/}
      <footer className="fixed bottom-0 w-full z-50 h-32 backdrop-blur-md flex justify-center items-center px-10 bg-[#0a1420]/95 border-t border-[#f0bf5c]/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center gap-4">
          <AnalysisButton onClick={() => navigate('/recommendations')} />
          <div className="font-sora text-xs tracking-[0.2em] text-[#f0bf5c]/70 font-bold uppercase">
            Enemy picks: {enemyCount}/5 • Ally picks: {allyCount}/5 • Bans: {banCount}/10
          </div>
        </div>
      </footer>
    </div>
  );
};
