import { useState, useEffect, Fragment } from 'react';
import type { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { Champion, BuildResponse } from '../types';

export const BuildGuidePage: FC = () => {
  const { state: navState } = useLocation();
  const navigate = useNavigate();
  const draftState = useDraftStore();

  const selectedChampion = navState?.champion as Champion | undefined;

  const [data, setData] = useState<BuildResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedChampion || !draftState.myRole) {
      navigate('/recommendations');
      return;
    }

    const fetchBuild = async () => {
      try {
        setLoading(true);
        const reqBody = {
          champion: selectedChampion.id,
          role: draftState.myRole,
          enemyPicks: draftState.enemyPicks
        };
        const res = await apiClient.post<BuildResponse>('/build', reqBody);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tactical build protocols.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuild();
  }, [selectedChampion, draftState, navigate]);

  if (loading || !selectedChampion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-t-2 border-r-2 border-primary border-solid rounded-full animate-spin flex items-center justify-center">
          <div className="w-16 h-16 border-b-2 border-l-2 border-secondary border-solid rounded-full animate-spin-reverse"></div>
        </div>
        <p className="mt-8 text-surface-container-highest uppercase tracking-[0.2em] animate-pulse">Synthesizing Loadout for {selectedChampion?.name || 'Unknown'}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-tertiary text-2xl font-display mb-4">CRITICAL ERROR</h2>
        <p className="text-surface-container-highest mb-8">{error}</p>
        <button onClick={() => navigate('/recommendations')} className="btn-sovereign-ghost">RETURN TO RECOMMENDATIONS</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/*Background with Champion Art*/}
      <div className="absolute top-0 right-0 w-[60%] lg:w-[40%] h-screen opacity-10 pointer-events-none mask-image-gradient-left">
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedChampion.id}_0.jpg`}
          alt={selectedChampion.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto relative z-10 flex flex-col items-start min-h-screen">

        <header className="mb-12 w-full flex flex-col md:flex-row justify-between items-start md:items-end">
          <div className="flex gap-6 items-end">
            <div className="w-20 h-20 lg:w-28 lg:h-28 border-2 border-primary p-1 bg-surface-container-lowest">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${selectedChampion.image}`}
                alt={selectedChampion.name}
                className="w-full h-full object-cover grayscale opacity-80"
              />
            </div>
            <div>
              <p className="text-secondary tracking-widest font-body uppercase text-sm mb-1">{draftState.myRole} PROTOCOL</p>
              <h1 className="text-5xl lg:text-7xl font-display text-white uppercase">{selectedChampion.name}</h1>
            </div>
          </div>
          <button onClick={() => navigate('/recommendations')} className="btn-sovereign-ghost mt-6 md:mt-0 text-sm">
            &larr; BACK
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full flex-1">

          {/*Main Column*/}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="bg-surface-container-low border border-surface-container-highest p-6 relative">
              <span className="absolute -top-3 left-4 bg-background px-3 text-tertiary uppercase text-sm tracking-widest border border-y-0 border-surface-container-highest">Initialization</span>
              <h3 className="font-display text-xl text-primary mb-6">Equipment Pipeline</h3>

              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="text-xs text-surface-container-highest uppercase tracking-widest mb-3">Starter Payload</h4>
                  <div className="flex gap-3">
                    {data.itemBuild.starter.map((item, i) => (
                      <div key={i} className="w-12 h-12 bg-surface-container-highest border border-surface-container-highest flex items-center justify-center p-2 text-[10px] text-center">{item}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs text-surface-container-highest uppercase tracking-widest mb-3">Core Framework</h4>
                  <div className="flex gap-4">
                    {data.itemBuild.core.map((item, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <div className="w-14 h-14 border border-secondary/50 bg-secondary/10 flex items-center justify-center p-2 text-xs text-secondary text-center shadow-[inset_0_0_10px_rgba(69,221,253,0.1)]">{item}</div>
                        {i < data.itemBuild.core.length - 1 && <span className="text-secondary">&rarr;</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs text-surface-container-highest uppercase tracking-widest mb-3">Situational Modules</h4>
                  <div className="flex flex-wrap gap-3">
                    {data.itemBuild.situational.map((item, i) => (
                      <div key={i} className="w-12 h-12 border border-surface-container-highest bg-surface-container-low flex items-center justify-center p-2 text-[10px] text-center hover:border-primary/30 transition-colors">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-low border border-surface-container-highest p-6 relative">
              <span className="absolute -top-3 left-4 bg-background px-3 text-secondary uppercase text-sm tracking-widest border border-y-0 border-surface-container-highest">Execution</span>
              <h3 className="font-display text-xl text-primary mb-6">Skill Vector</h3>

              <div className="flex flex-wrap gap-2 text-xl font-display">
                {data.skillOrder.map((skill, index) => (
                  <Fragment key={index}>
                    <span className={`w-10 h-10 flex items-center justify-center ${skill === 'R' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container-highest text-white'}`}>
                      {skill}
                    </span>
                    {index < data.skillOrder.length - 1 && <span className="text-surface-container-highest flex items-center">-</span>}
                  </Fragment>
                ))}
              </div>
            </section>
          </div>

          {/*Right Column*/}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="bg-surface-container-highest p-6 border-l-4 border-primary shadow-lg">
              <h3 className="font-display text-xl text-white mb-6 uppercase tracking-widest">Rune Configuration</h3>

              <div className="mb-6">
                <p className="text-primary text-sm uppercase tracking-widest mb-3">Primary: {data.runes.primary.path}</p>
                <div className="flex flex-wrap gap-2">
                  {data.runes.primary.keystones.map((rune, i) => (
                    <span key={i} className="px-3 py-1 bg-surface-container-low border border-primary/30 text-xs text-white">{rune}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-secondary text-sm uppercase tracking-widest mb-3">Secondary: {data.runes.secondary.path}</p>
                <div className="flex flex-wrap gap-2">
                  {data.runes.secondary.keystones.map((rune, i) => (
                    <span key={i} className="px-3 py-1 bg-surface-container-low border border-secondary/30 text-xs text-white">{rune}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-background border border-tertiary/20 p-6 flex-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-tertiary/10 to-transparent"></div>

              <h3 className="font-display text-xl text-tertiary mb-6 uppercase tracking-widest">Tactical Briefing</h3>

              <ul className="flex flex-col gap-4 text-sm text-surface-container-highest relative z-10">
                {data.tips.map((tip, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="text-tertiary leading-tight">&bull;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

//Utilities for custom CSS used in components
const style = document.createElement('style');
style.innerHTML = `
  .mask-image-gradient-left {
    -webkit-mask-image: linear-gradient(to right, transparent, black);
    mask-image: linear-gradient(to right, transparent, black);
  }
  @keyframes spin-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  .animate-spin-reverse {
    animation: spin-reverse 1s linear infinite;
  }
`;
document.head.appendChild(style);
