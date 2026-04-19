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
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-headline text-primary tracking-widest uppercase flex items-center gap-3`}>
          <span>{highlight === 'primary' ? '🏆' : highlight === 'secondary' ? '⚡' : '💎'}</span> {title}
        </h2>
        <span className="h-px bg-linear-to-r from-primary/50 to-transparent grow ml-8"></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {champs.map((champ, idx) => (
          <div
            key={champ.id}
            className="relative group cursor-pointer"
            onClick={() => onViewBuild(champ)}
            style={{ animation: 'fadeInUp 0.5s ease backwards', animationDelay: `${idx * 100}ms` }}
          >
            <div className="absolute -inset-0.5 bg-linear-to-b from-primary via-secondary to-primary opacity-20 blur-sm group-hover:opacity-40 transition-opacity" style={{ display: highlight === 'primary' ? 'block' : 'none' }}></div>
            <div className="relative bg-surface-container-highest border border-primary/30 p-6 flex flex-col h-full hover:border-primary/50 transition-colors" style={{ display: highlight === 'primary' ? 'block' : undefined }}>
              <div className="bracket-tl"></div>
              <div className="bracket-tr"></div>
              <div className="bracket-bl"></div>
              <div className="bracket-br"></div>
              {highlight === 'primary' && (
                <div className="absolute top-0 right-0 px-3 py-1 gold-gradient-bg text-on-primary font-rajdhani text-xs font-bold uppercase tracking-widest">
                  #1
                </div>
              )}
              <div className="h-48 mb-6 overflow-hidden border border-outline-variant/30 relative">
                <img
                  alt={champ.name}
                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`}
                  onError={(e) => {
                    e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champ.image}`;
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-surface-container-highest to-transparent"></div>
                <div className="absolute bottom-2 left-2">
                  <p className="text-3xl font-headline text-on-surface uppercase tracking-widest">{champ.name}</p>
                  <p className="text-[10px] text-primary uppercase font-rajdhani tracking-widest">Piltover Enforcer</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-rajdhani text-on-surface-variant uppercase">Win Probability</span>
                  <span className="text-2xl font-rajdhani text-primary">58.4%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-rajdhani tracking-tighter">
                    <span className="text-tertiary">Counter Score</span>
                    <span className="text-tertiary">88</span>
                  </div>
                  <div className="h-1 bg-surface-container-lowest">
                    <div className="h-full bg-tertiary" style={{ width: '88%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-rajdhani tracking-tighter mt-2">
                    <span className="text-secondary">Synergy Score</span>
                    <span className="text-secondary">92</span>
                  </div>
                  <div className="h-1 bg-surface-container-lowest">
                    <div className="h-full bg-secondary" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
              <button className="mt-auto gold-gradient-bg text-on-primary font-headline uppercase tracking-[0.2em] py-3 text-sm hover:brightness-110 transition-all sovereign-clip active:scale-95 shadow-lg shadow-primary/20">
                SELECT CHAMPION
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-t-2 border-r-2 border-primary border-solid rounded-full animate-spin flex items-center justify-center">
          <div className="w-16 h-16 border-b-2 border-l-2 border-secondary border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-8 text-on-surface-variant uppercase tracking-[0.2em] animate-pulse">Loading Recommendations...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-tertiary text-2xl font-display mb-4">CRITICAL ERROR</h2>
        <p className="text-on-surface-variant mb-8">{error}</p>
        <button onClick={() => navigate('/draft')} className="btn-sovereign-ghost">RETURN TO DRAFT</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/*Background Effects*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-linear-to-br from-[#0a1420] via-background to-[#120a1c] opacity-100"></div>
        <div className="absolute inset-0 hex-overlay opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 blur-[120px]"></div>
      </div>

      {/*Navigation*/}
      <nav className="flex justify-between items-center w-full px-6 py-4 z-50 bg-[#0a1420] bg-linear-to-b from-surface-container-low to-transparent shadow-[0px_0px_32px_0px_rgba(3,11,23,0.4)] relative">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-bold tracking-tighter text-primary font-newsreader uppercase">Sovereign Draft</span>
          <div className="hidden md:flex gap-6 items-center">
            <a className="text-primary border-b-2 border-primary pb-1 font-newsreader tracking-[0.05em] uppercase text-sm" href="#">Draft Advisor</a>
            <a className="text-secondary/70 hover:text-secondary font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Champion Pool</a>
            <a className="text-secondary/70 hover:text-secondary font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Match History</a>
            <a className="text-secondary/70 hover:text-secondary font-newsreader tracking-[0.05em] uppercase text-sm transition-all duration-200" href="#">Leaderboard</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="gold-gradient-bg px-4 py-1.5 font-rajdhani tracking-widest text-xs uppercase hover:brightness-110 transition-all active:scale-95">Analyze Draft</button>
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:bg-surface-container-highest p-2 transition-all">settings</span>
            <span className="material-symbols-outlined text-secondary cursor-pointer hover:bg-surface-container-highest p-2 transition-all">notifications</span>
          </div>
        </div>
      </nav>

      {/*Sidebar*/}
      <aside className="hidden lg:flex flex-col h-full w-64 fixed left-0 top-0 pt-20 pb-6 bg-[#0a1420] border-r border-primary/10 z-40 shadow-2xl">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-highest border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">analytics</span>
            </div>
            <div>
              <p className="text-primary font-headline text-lg leading-tight">War Room</p>
              <p className="text-[10px] text-secondary font-rajdhani tracking-tighter opacity-70 uppercase">Sovereign AI Active</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-4 px-6 py-3 text-secondary/60 hover:text-secondary hover:bg-surface-container-low transition-all duration-150" href="#">
            <span className="material-symbols-outlined">strategy</span>
            <span className="font-label text-sm tracking-wide">Current Draft</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-primary bg-surface-container-highest border-l-4 border-primary transition-all duration-150" href="#">
            <span className="material-symbols-outlined">swords</span>
            <span className="font-label text-sm tracking-wide">Counter Picks</span>
          </a>
          <a className="flex items-center gap-4 px-6 py-3 text-secondary/60 hover:text-secondary hover:bg-surface-container-low transition-all duration-150" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="font-label text-sm tracking-wide">Synergy</span>
          </a>
        </nav>
      </aside>

      {/*Main Content*/}
      <main className="lg:ml-64 pt-6 px-6 lg:px-12 pb-20 relative z-10">
        {/*Header Section*/}
        <header className="mb-10">
          <button onClick={() => navigate('/draft')} className="flex items-center gap-2 text-secondary font-rajdhani tracking-widest text-xs mb-4 hover:gap-4 transition-all uppercase">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            BACK TO DRAFT
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline text-on-surface tracking-widest mb-1 uppercase">Recommendations</h1>
              <p className="text-secondary/70 font-body text-xs uppercase tracking-tighter">Based on current draft state • {state.myRole} role</p>
            </div>
            <div className="flex items-center gap-4 bg-surface-container-low p-2 border-l-2 border-primary">
              <span className="material-symbols-outlined text-primary text-xl">query_stats</span>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-rajdhani">Simulation Confidence</p>
                <p className="text-primary font-rajdhani text-lg leading-none">94.2%</p>
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
