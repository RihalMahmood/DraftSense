import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { RecommendationResponse, Champion } from '../types';

interface SectionProps {
  title: string;
  champs: Champion[];
  highlight?: 'primary' | 'secondary' | 'tertiary';
  onViewBuild: (champion: Champion) => void;
}

const Section = ({ title, champs, highlight, onViewBuild }: SectionProps) => {
  const getDDragonImg = (champId: string) => {
    const assetId = champId === 'Fiddlesticks' ? 'FiddleSticks' : champId;
    return [
      `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${assetId}_0.jpg`,
      `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${assetId}_0.jpg`
    ];
  };

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-cinzel text-primary tracking-widest uppercase flex items-center gap-3">
          <span>{highlight === 'primary' ? '🏆' : highlight === 'secondary' ? '⚡' : '💎'}</span> {title}
        </h2>
        <span className="h-px bg-gradient-to-r from-primary/50 to-transparent grow ml-8"></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {champs.map((champ, idx) => {
          const [loadingImg, fallbackImg] = getDDragonImg(champ.id);
          return (
            <div
              key={champ.id}
              className="relative group cursor-pointer"
              onClick={() => onViewBuild(champ)}
              style={{ animation: 'fadeInUp 0.5s ease backwards', animationDelay: `${idx * 100}ms` }}
            >
              <div
                className="absolute -inset-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-20 blur-sm group-hover:opacity-40 transition-opacity"
                style={{ display: highlight === 'primary' ? 'block' : 'none' }}>
              </div>
              <div
                className="relative bg-surface-container-highest border border-primary/30 p-6 flex flex-col h-full hover:border-primary/50 transition-colors"
                style={{ display: highlight === 'primary' ? 'block' : undefined }}>
                <div className="angular-bracket-tl"></div>
                <div className="angular-bracket-tr"></div>
                <div className="angular-bracket-bl"></div>
                <div className="angular-bracket-br"></div>

                {highlight === 'primary' && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-br from-primary to-primary-container text-on-primary font-rajdhani text-xs font-bold uppercase tracking-widest">
                    #1
                  </div>
                )}

                <div className="h-48 mb-6 overflow-hidden border border-outline-variant/30 relative">
                  <img
                    alt={champ.name}
                    className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                    src={loadingImg}
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                  <div className="absolute bottom-2 left-2">
                    <p className="text-3xl font-cinzel font-bold text-on-surface uppercase tracking-widest leading-none drop-shadow-md">{champ.name}</p>
                    <p className="text-[10px] text-primary uppercase font-rajdhani tracking-widest drop-shadow-md">{champ.title || 'Champion'}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  {/*Fake stats representing AI score outputs*/}
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-rajdhani text-on-surface-variant uppercase">Recommended Pick</span>
                    <span className="text-2xl font-rajdhani text-primary">OPT</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-rajdhani tracking-tighter">
                      <span className="text-tertiary">Matchup Advantage</span>
                      <span className="text-tertiary">High</span>
                    </div>
                    <div className="h-1 bg-surface-container-lowest">
                      <div className="h-full bg-tertiary w-4/5"></div>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-rajdhani tracking-tighter mt-2">
                      <span className="text-secondary">Synergy Fit</span>
                      <span className="text-secondary">Excellent</span>
                    </div>
                    <div className="h-1 bg-surface-container-lowest">
                      <div className="h-full bg-secondary w-11/12"></div>
                    </div>
                  </div>
                </div>

                <button className="mt-auto bg-gradient-to-tl from-primary to-primary-container text-on-primary font-cinzel font-bold uppercase tracking-[0.2em] py-3 text-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20"
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}>
                  SELECT CHAMPION
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export const RecommendationsPage: FC = () => {
  const navigate = useNavigate();
  const state = useDraftStore();

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.myRole) {
      navigate('/');
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const reqBody = {
          myRole: state.myRole,
          bans: state.bans.filter(Boolean),
          enemyPicks: state.enemyPicks,
          allyPicks: state.allyPicks
        };
        const res = await apiClient.post<RecommendationResponse>('/recommend', reqBody);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to query the tactical engine. Ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030B17] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-t-2 border-r-2 border-primary border-solid rounded-full animate-spin flex items-center justify-center">
          <div className="w-16 h-16 border-b-2 border-l-2 border-secondary border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-8 text-on-surface-variant font-rajdhani uppercase tracking-[0.2em] animate-pulse">Running Neural Simulation...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030B17] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-tertiary text-2xl font-cinzel uppercase tracking-widest mb-4">CRITICAL ERROR</h2>
        <p className="text-on-surface-variant mb-8 font-body">{error}</p>
        <button onClick={() => navigate('/draft')}
          className="bg-surface-container border border-primary/40 text-primary font-cinzel px-8 py-3 tracking-widest uppercase hover:bg-primary/10 transition-colors">
          RETURN TO DRAFT
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#030B17] text-on-surface font-body min-h-screen overflow-x-hidden flex flex-col">
      {/*Background Effects*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1420] via-[#030B17] to-[#120a1c] opacity-100"></div>
        <div className="absolute inset-0 hex-grid opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 blur-[120px]"></div>
      </div>

      {/*Navigation Shell (TopNavBar)*/}
      <nav className="flex justify-between items-center w-full px-6 py-4 z-50 fixed top-0 bg-[#0a1420] bg-gradient-to-b from-[#131c29] to-transparent shadow-[0px_0px_32px_0px_rgba(3,11,23,0.4)]">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-[0.05em] text-[#f0bf5c] font-newsreader uppercase">Sovereign Draft</span>
          <div className="hidden md:flex gap-6 items-center">
            <a className="text-[#f0bf5c] border-b-2 border-[#f0bf5c] pb-1 font-newsreader tracking-[0.05em] uppercase text-sm" href="#">Draft Advisor</a>
            <a className="text-[#45ddfd]/70 hover:text-[#45ddfd] font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Champion Pool</a>
            <a className="text-[#45ddfd]/70 hover:text-[#45ddfd] font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Match History</a>
            <a className="text-[#45ddfd]/70 hover:text-[#45ddfd] font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Leaderboard</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:bg-[#212b38] p-2 transition-all">settings</span>
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:bg-[#212b38] p-2 transition-all">notifications</span>
          </div>
        </div>
      </nav>

      {/*Sidebar (SideNavBar)*/}
      <aside className="hidden lg:flex flex-col h-full w-64 fixed left-0 top-0 pt-20 pb-6 bg-[#0a1420] border-r border-[#f0bf5c]/10 z-40 shadow-2xl">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-highest border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <div>
              <p className="text-primary font-cinzel font-bold text-lg leading-tight">War Room</p>
              <p className="text-[10px] text-secondary font-rajdhani tracking-tighter opacity-70 uppercase">Sovereign AI Active</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-4 px-6 py-3 text-secondary/60 hover:text-secondary hover:bg-[#131c29] transition-all duration-150" href="#">
            <span className="material-symbols-outlined">strategy</span>
            <span className="font-body text-sm tracking-wide">Current Draft</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-primary bg-[#212b38] border-l-4 border-primary transition-all duration-150" href="#">
            <span className="material-symbols-outlined">swords</span>
            <span className="font-body text-sm tracking-wide">Counter Picks</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-secondary/60 hover:text-secondary hover:bg-[#131c29] transition-all duration-150" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="font-body text-sm tracking-wide">Synergy</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-secondary/60 hover:text-secondary hover:bg-[#131c29] transition-all duration-150" href="#">
            <span className="material-symbols-outlined">military_tech</span>
            <span className="font-body text-sm tracking-wide">Strategy</span>
          </a>
        </nav>
        <div className="px-6 pt-4 border-t border-[#f0bf5c]/5">
          <button className="w-full py-3 border border-primary/30 text-primary font-rajdhani font-bold uppercase tracking-widest text-xs hover:bg-primary/10 transition-all">
            Export Draft
          </button>
        </div>
      </aside>

      {/*Main Content*/}
      <main className="lg:ml-64 pt-24 px-6 lg:px-12 pb-20 relative z-10 w-full flex-1">
        {/*Header Section*/}
        <header className="mb-10">
          <button onClick={() => navigate('/draft')}
            className="flex items-center gap-2 text-secondary font-rajdhani font-bold tracking-widest text-xs mb-4 hover:gap-4 transition-all uppercase">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Draft Board
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-cinzel font-bold text-on-surface tracking-widest mb-1 uppercase drop-shadow-md">Recommendations</h1>
              <p className="text-secondary/70 font-body text-xs uppercase tracking-tighter">Based on current draft state • {state.myRole} role</p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-low p-2 border-l-2 border-primary">
              <span className="material-symbols-outlined text-primary text-xl">query_stats</span>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-rajdhani">Simulation Confidence</p>
                <p className="text-primary font-rajdhani text-lg leading-none font-bold">94.2%</p>
              </div>
            </div>
          </div>
        </header>

        {/*Section: Overall Best Picks*/}
        <Section
          title="Top Overall Recommendations"
          champs={data.overallBest || []}
          highlight="primary"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />

        {/*Section: Counter Picks*/}
        <Section
          title="Counter Picks"
          champs={data.counterPicks || []}
          highlight="secondary"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />

        {/*Section: Synergy Picks*/}
        <Section
          title="Team Synergy Picks"
          champs={data.synergyPicks || []}
          highlight="tertiary"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />
      </main>
    </div>
  );
};
