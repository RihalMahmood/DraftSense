import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { RecommendationResponse, Champion } from '../types';

//Pseudo-random generator for stable mock scores based on champion id
const getMockScores = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const base = Math.abs(hash) % 30; // 0-29
  return {
    winProb: 50 + (base / 2), //50-64.5
    counter: 60 + base,       //60-89
    synergy: 65 + (base % 25) //65-89
  };
};

interface SectionProps {
  title: string;
  subtitle?: string;
  champs: Champion[];
  highlight?: 'primary' | 'secondary' | 'tertiary';
  layout: 'large' | 'small';
  icon: string;
  onViewBuild: (champion: Champion) => void;
}

const Section = ({ title, subtitle, champs, highlight, layout, icon, onViewBuild }: SectionProps) => {
  const getDDragonImg = (champ: Champion, type: 'loading' | 'splash' = 'loading') => {
    const assetId = champ.id === 'Fiddlesticks' ? 'FiddleSticks' : champ.id;
    if (type === 'splash') {
      return [
        `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${assetId}_0.jpg`,
        `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${assetId}_0.jpg`
      ];
    }
    return [
      `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${assetId}_0.jpg`,
      `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${assetId}_0.jpg`
    ];
  };

  if (layout === 'small') {
    return (
      <section className="mb-16">
        <div className={`flex items-center gap-4 mb-6 border-t-2 pt-6 ${highlight === 'secondary' ? 'border-error' : 'border-secondary'}`}>
          <h2 className="text-xl font-cinzel font-bold text-on-surface tracking-widest uppercase flex items-center gap-2">
            <span>{icon}</span> {title}
          </h2>
          {subtitle && <p className="text-xs text-on-surface-variant font-body italic">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {champs.slice(0, 5).map((champ, idx) => {
            const [splashImg, fallbackImg] = getDDragonImg(champ, 'splash');
            const scores = getMockScores(champ.id);
            const scoreVal = highlight === 'secondary' ? scores.counter : scores.synergy;

            return (
              <div
                key={champ.id}
                onClick={() => onViewBuild(champ)}
                className={`bg-surface-container-low border-b cursor-pointer hover:bg-surface-container hover:translate-y-[-4px] transition-all duration-300 p-3 group ${highlight === 'secondary' ? 'border-error/30' : 'border-secondary/30'}`}
                style={{ animation: 'fadeInUp 0.5s ease backwards', animationDelay: `${idx * 100}ms` }}
              >
                <img
                  className="w-full h-32 object-cover grayscale group-hover:grayscale-0 transition-all mb-3 border border-outline-variant/10"
                  src={splashImg}
                  alt={champ.name}
                  onError={(e) => { e.currentTarget.src = fallbackImg; }}
                />
                <h3 className="text-on-surface font-cinzel font-bold text-sm uppercase mb-1">{champ.name}</h3>
                <div className="h-1 w-full bg-surface-container-lowest mb-2">
                  <div className={`h-full ${highlight === 'secondary' ? 'bg-gradient-to-r from-error to-primary' : 'bg-secondary'}`} style={{ width: `${scoreVal}%` }}></div>
                </div>
                <p className="text-[9px] text-on-surface-variant font-body leading-snug truncate">
                  {champ.title || 'Excellent pick for the draft.'}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  //Large Layout
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-cinzel font-bold text-primary tracking-widest uppercase flex items-center gap-3">
          <span>{icon}</span> {title}
        </h2>
        <span className="h-px bg-gradient-to-r from-primary/50 to-transparent flex-grow ml-8"></span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {champs.slice(0, 3).map((champ, idx) => {
          const [loadingImg, fallbackImg] = getDDragonImg(champ, 'loading');
          const isRank1 = idx === 0;
          const scores = getMockScores(champ.id);

          return (
            <div
              key={champ.id}
              className="relative group cursor-pointer"
              onClick={() => onViewBuild(champ)}
              style={{ animation: 'fadeInUp 0.5s ease backwards', animationDelay: `${idx * 100}ms` }}
            >
              {isRank1 && (
                <div className="absolute -inset-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
              )}
              <div
                className={`relative bg-surface-container-highest flex flex-col h-full transition-colors ${isRank1
                  ? 'border border-primary/30 p-6'
                  : 'border border-outline-variant/30 p-6 hover:border-secondary/50'
                  }`}
              >
                {isRank1 && (
                  <>
                    <div className="angular-bracket-tl"></div>
                    <div className="angular-bracket-tr"></div>
                    <div className="angular-bracket-bl"></div>
                    <div className="angular-bracket-br"></div>
                    <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-br from-primary to-primary-container text-on-primary font-rajdhani text-xs font-bold uppercase tracking-widest">
                      Best Match
                    </div>
                  </>
                )}

                <div className={`h-48 mb-6 overflow-hidden relative ${isRank1 ? 'border border-outline-variant/30' : 'border border-outline-variant/20'}`}>
                  <img
                    alt={champ.name}
                    className={`w-full h-full object-cover transition-transform duration-700 ${isRank1 ? 'scale-110 group-hover:scale-125' : 'group-hover:scale-110'}`}
                    src={loadingImg}
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                  <div className="absolute bottom-2 left-2">
                    <p className="text-3xl font-cinzel font-bold text-on-surface uppercase tracking-widest">{champ.name}</p>
                    <p className={`text-[10px] uppercase font-rajdhani tracking-widest ${isRank1 ? 'text-primary' : 'text-on-surface-variant'}`}>{champ.title || 'Champion'}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-rajdhani text-on-surface-variant uppercase">Win Probability</span>
                    <span className={`text-2xl font-rajdhani font-bold ${isRank1 ? 'text-primary' : 'text-secondary'}`}>{scores.winProb.toFixed(1)}%</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-rajdhani">
                      <span className={isRank1 ? 'text-error' : 'text-error/70'}>Counter Score</span>
                      <span className={isRank1 ? 'text-error' : ''}>{scores.counter}</span>
                    </div>
                    <div className="h-1 bg-surface-container-lowest">
                      <div className={`h-full ${isRank1 ? 'bg-error' : 'bg-error/50'}`} style={{ width: `${scores.counter}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-rajdhani mt-2">
                      <span className={isRank1 ? 'text-secondary' : 'text-secondary/70'}>Synergy Score</span>
                      <span className={isRank1 ? 'text-secondary' : ''}>{scores.synergy}</span>
                    </div>
                    <div className="h-1 bg-surface-container-lowest">
                      <div className={`h-full ${isRank1 ? 'bg-secondary' : 'bg-secondary/50'}`} style={{ width: `${scores.synergy}%` }}></div>
                    </div>
                  </div>
                </div>

                <button
                  className={`mt-auto uppercase tracking-[0.2em] py-3 text-sm transition-all shadow-lg ${isRank1
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary font-cinzel font-bold hover:brightness-110 active:scale-95'
                    : 'border border-primary/40 text-primary hover:bg-primary/10 font-cinzel font-bold'
                    }`}
                  style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                >
                  Select {champ.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>
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

  const getDDragonSquareImg = (champId: string | null) => {
    if (!champId) return '';
    const assetId = champId === 'Fiddlesticks' ? 'FiddleSticks' : champId;
    return `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${assetId}_0.jpg`;
  };

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
        <h2 className="text-tertiary text-2xl font-cinzel font-bold uppercase tracking-widest mb-4">CRITICAL ERROR</h2>
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
      <style>{`
        .hex-grid {
          background-image: radial-gradient(circle at 2px 2px, rgba(11, 196, 227, 0.08) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .angular-bracket-tl {
          position: absolute; top: -2px; left: -2px; width: 12px; height: 12px;
          border-top: 2px solid #f0bf5c; border-left: 2px solid #f0bf5c;
        }
        .angular-bracket-tr {
          position: absolute; top: -2px; right: -2px; width: 12px; height: 12px;
          border-top: 2px solid #f0bf5c; border-right: 2px solid #f0bf5c;
        }
        .angular-bracket-bl {
          position: absolute; bottom: -2px; left: -2px; width: 12px; height: 12px;
          border-bottom: 2px solid #f0bf5c; border-left: 2px solid #f0bf5c;
        }
        .angular-bracket-br {
          position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px;
          border-bottom: 2px solid #f0bf5c; border-right: 2px solid #f0bf5c;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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

      {/*Main Content*/}
      <main className="pt-24 px-6 lg:px-12 pb-20 relative z-10 w-full flex-1 max-w-7xl mx-auto">
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

        {/* Draft State Summary Bar */}
        <section className="mb-12">
          <div className="bg-surface-container-high/50 backdrop-blur-md p-4 flex flex-wrap lg:flex-nowrap items-center gap-8 border-y border-outline-variant/10">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-rajdhani text-error uppercase tracking-widest">Enemy Bans</span>
              <div className="flex gap-1.5">
                {state.bans.filter(b => b !== null).length > 0 ? (
                  state.bans.map((ban, i) => ban && (
                    <div key={i} className="w-8 h-8 grayscale opacity-60 border border-error/30 bg-surface-container-lowest" title={`${ban} Ban`}>
                      <img alt={ban} className="w-full h-full object-cover" src={getDDragonSquareImg(ban)} />
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-on-surface-variant italic">No Bans</span>
                )}
              </div>
            </div>
            <div className="h-8 w-px bg-outline-variant/20 hidden lg:block"></div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-rajdhani text-secondary uppercase tracking-widest">Team Picks</span>
              <div className="flex gap-2">
                {Object.values(state.allyPicks).filter(p => p !== null).length > 0 ? (
                  Object.values(state.allyPicks).map((pick, i) => pick && (
                    <div key={i} className="w-10 h-10 border border-secondary/50 bg-surface-container-lowest" title={pick}>
                      <img alt={pick} className="w-full h-full object-cover" src={getDDragonSquareImg(pick)} />
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-on-surface-variant italic">No Picks Yet</span>
                )}
              </div>
            </div>
            <div className="flex-grow"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>swords</span>
              <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-primary">Awaiting {state.myRole} Pick</span>
            </div>
          </div>
        </section>

        {/*Section: Overall Best Picks*/}
        <Section
          title="Top Overall Recommendations"
          champs={data.overallBest || []}
          highlight="primary"
          layout="large"
          icon="🏆"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />

        {/*Section: Counter Picks*/}
        <Section
          title="Best Counter Picks"
          subtitle="Targeting specific enemy weaknesses"
          champs={data.counterPicks || []}
          highlight="secondary"
          layout="small"
          icon="⚔️"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />

        {/*Section: Synergy Picks*/}
        <Section
          title="Best Synergy Picks"
          subtitle="Complementing Allied Draft"
          champs={data.synergyPicks || []}
          highlight="tertiary"
          layout="small"
          icon="🤝"
          onViewBuild={(champ) => navigate('/build', { state: { champion: champ } })}
        />
      </main>

      {/*Bottom Action Bar (FAB-like for focused mobile interaction)*/}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden bg-surface-container-high/90 backdrop-blur-xl border-t border-primary/20 z-50">
        <div className="flex gap-4">
          <button onClick={() => navigate('/draft')} className="flex-1 py-4 border border-secondary/30 text-secondary font-rajdhani font-bold uppercase tracking-widest text-xs">
            Simulate More
          </button>
          <button className="flex-1 py-4 bg-gradient-to-r from-[#f0bf5c] to-[#c89b3c] text-on-primary font-rajdhani font-bold uppercase tracking-widest text-xs">
            Lock Recommendation
          </button>
        </div>
      </div>
    </div>
  );
};
