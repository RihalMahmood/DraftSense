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
          <div className="w-16 h-16 border-b-2 border-l-2 border-secondary border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-8 text-on-surface-variant uppercase tracking-[0.2em] animate-pulse">Synthesizing Loadout for {selectedChampion?.name || 'Unknown'}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-tertiary text-2xl font-display mb-4">CRITICAL ERROR</h2>
        <p className="text-on-surface-variant mb-8">{error}</p>
        <button onClick={() => navigate('/recommendations')} className="btn-sovereign-ghost">RETURN TO RECOMMENDATIONS</button>
      </div>
    );
  }

  return (
    <div className="text-on-surface selection:bg-primary selection:text-on-primary min-h-screen">
      {/*Top Navigation*/}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0a1420] shadow-[0_0_32px_0_rgba(3,11,23,0.4)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-480 mx-auto relative">
          <div className="text-2xl font-bold tracking-widest text-primary uppercase font-newsreader">
            SOVEREIGN TACTICS
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a className="text-slate-400 font-medium hover:text-secondary transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">ROLE</a>
            <a className="text-slate-400 font-medium hover:text-secondary transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">DRAFT</a>
            <a className="text-slate-400 font-medium hover:text-secondary transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">PICKS</a>
            <a className="text-primary border-b-2 border-primary pb-1 transition-all duration-300 font-label uppercase tracking-widest text-xs" href="#">BUILD</a>
          </nav>
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-primary cursor-pointer hover:text-secondary transition-colors">account_circle</span>
            <span className="material-symbols-outlined text-primary cursor-pointer hover:text-secondary transition-colors">settings</span>
          </div>
          <div className="bg-linear-to-r from-transparent via-primary/20 to-transparent h-px w-full absolute bottom-0 left-0"></div>
        </div>
      </header>

      {/*Side Navigation*/}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a1420] border-r border-primary/10 flex flex-col py-8 z-40 pt-24 lg:flex shadow-[32px_0_32px_rgba(3,11,23,0.4)]">
        <div className="px-6 mb-8 flex items-center space-x-4">
          <div className="w-12 h-12 border-2 border-primary overflow-hidden">
            <img
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${selectedChampion.image}`}
              alt={selectedChampion.name}
            />
          </div>
          <div>
            <div className="font-headline font-black text-primary tracking-widest text-lg">{selectedChampion.name.toUpperCase()}</div>
            <div className="text-[10px] text-slate-500 font-label uppercase tracking-[0.2em]">The {selectedChampion.name}</div>
          </div>
        </div>
        <nav className="grow">
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-secondary hover:bg-surface-container-low transition-all duration-300" href="#">
            <span className="material-symbols-outlined">auto_fix_high</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Runes</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 bg-linear-to-r from-primary/10 to-transparent border-l-4 border-primary text-primary" href="#">
            <span className="material-symbols-outlined">swords</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Items</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-secondary hover:bg-surface-container-low transition-all duration-300" href="#">
            <span className="material-symbols-outlined">bolt</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Skills</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-secondary hover:bg-surface-container-low transition-all duration-300" href="#">
            <span className="material-symbols-outlined">gavel</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Matchups</span>
          </a>
        </nav>
        <div className="px-6 mt-auto">
          <button className="w-full bg-primary py-3 text-on-primary font-bold tracking-widest text-[10px] uppercase transition-all duration-300 hover:brightness-110 active:scale-95">
            LOCK BUILD
          </button>
        </div>
      </aside>

      <main className="lg:pl-64 pt-16">
        {/*Hero Header*/}
        <section className="relative h-75 overflow-hidden flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedChampion.id}_0.jpg')`
            }}
          ></div>
          <div className="absolute inset-0 bg-background opacity-85"></div>
          <div className="absolute inset-0 hex-overlay"></div>
          <div className="relative z-10 w-full px-8 max-w-6xl mx-auto">
            <div className="flex items-center text-xs tracking-widest space-x-2 text-slate-400 mb-6 uppercase">
              <span>ROLE</span> <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span>DRAFT</span> <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span>PICKS</span> <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary font-bold">BUILD</span>
            </div>
            <div className="flex items-center space-x-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-primary p-1 overflow-hidden">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${selectedChampion.image}`}
                    alt={selectedChampion.name}
                  />
                </div>
                <div className="absolute -bottom-2 right-0 bg-primary text-on-primary text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter">LVL 18</div>
              </div>
              <div>
                <button
                  onClick={() => navigate('/recommendations')}
                  className="text-secondary text-[10px] font-bold tracking-[0.2em] mb-2 uppercase flex items-center hover:opacity-80 transition-opacity"
                >
                  <span className="material-symbols-outlined mr-2 text-sm">arrow_back</span> RECOMMENDATIONS
                </button>
                <h1 className="text-6xl font-cinzel text-primary tracking-widest">{selectedChampion.name.toUpperCase()}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase">{draftState.myRole?.toUpperCase()}</span>
                  <span className="text-slate-400 text-sm italic font-headline opacity-80 tracking-wide">Build guide vs. meta champions</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Content Grid*/}
        <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-12 gap-8">
          {/*SECTION 1: RUNES*/}
          <section className="col-span-12 lg:col-span-5">
            <div className="bg-surface-container relative p-6 border-t-[3px] border-primary gold-bracket h-full">
              <h2 className="font-cinzel text-primary text-xl mb-8 tracking-widest flex items-center">
                <span className="material-symbols-outlined mr-3">auto_fix_high</span> RUNE PAGE
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {/*Precision Path*/}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                    <span className="font-label font-black text-[10px] tracking-[0.2em]">PRECISION</span>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center p-1">
                      <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>award_star</span>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-primary text-xl">health_and_safety</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-slate-500 text-xl">speed</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-surface-container">
                        <span className="material-symbols-outlined text-slate-500 text-xl">skull</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/*Domination Path*/}
                <div className="space-y-6 border-l border-white/5 pl-8">
                  <div className="flex items-center space-x-2 text-secondary">
                    <span className="material-symbols-outlined">target</span>
                    <span className="font-label font-black text-[10px] tracking-[0.2em]">DOMINATION</span>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex flex-col space-y-4">
                      <div className="w-10 h-10 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/10">
                        <span className="material-symbols-outlined text-secondary text-xl">offline_bolt</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/10">
                        <span className="material-symbols-outlined text-secondary text-xl">footprint</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/*Shards*/}
              <div className="pt-4 space-y-3">
                <div className="flex space-x-2">
                  <div className="w-6 h-6 rotate-45 border border-primary/40 bg-primary/20 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-primary">+10</div>
                  </div>
                  <div className="w-6 h-6 rotate-45 border border-primary/40 bg-primary/20 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-primary">+10</div>
                  </div>
                  <div className="w-6 h-6 rotate-45 border border-slate-500/40 bg-slate-500/10 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-slate-400">+6</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/*SECTION 2: ITEM BUILD*/}
          <section className="col-span-12 lg:col-span-7">
            <div className="bg-surface-container relative p-6 border-t-[3px] border-primary gold-bracket h-full">
              <h2 className="font-cinzel text-primary text-xl mb-6 tracking-widest flex items-center">
                <span className="material-symbols-outlined mr-3">shopping_cart</span> ITEM BUILD ORDER
              </h2>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-4">STARTER</p>
                  <div className="flex space-x-4">
                    {data.itemBuild.starter.map((item, i) => (
                      <div key={i} className="flex items-center bg-surface-container-low p-2 pr-4 space-x-3 item-clip border-l-2 border-slate-600">
                        <div className="w-10 h-10 object-cover bg-slate-600 rounded">{item}</div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-label text-primary uppercase tracking-[0.2em] mb-4">CORE BUILD</p>
                  <div className="flex space-x-6 items-end">
                    {data.itemBuild.core.map((item, i) => (
                      <Fragment key={i}>
                        <div className="relative group">
                          <div className="absolute -top-3 -left-2 bg-primary text-on-primary w-5 h-5 flex items-center justify-center font-bold z-10 text-xs">{i + 1}</div>
                          <div className="w-20 h-20 border-2 border-primary overflow-hidden item-clip">
                            <div className="w-full h-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold">{item}</div>
                          </div>
                          <div className="text-center mt-2 font-bold">3100g</div>
                        </div>
                        {i < data.itemBuild.core.length - 1 && <span className="material-symbols-outlined text-slate-600 self-center pb-8">arrow_forward</span>}
                      </Fragment>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-label text-secondary uppercase tracking-[0.2em] mb-4">SITUATIONAL</p>
                  <div className="flex flex-wrap gap-3">
                    {data.itemBuild.situational.map((item, i) => (
                      <div key={i} className="w-14 h-14 border border-outline-variant bg-surface-container-low flex items-center justify-center text-xs font-bold text-slate-400 hover:border-secondary/50 transition-colors">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/*SKILLS SECTION*/}
          <section className="col-span-12">
            <div className="bg-surface-container relative p-6 border-t-[3px] border-secondary gold-bracket">
              <h2 className="font-cinzel text-secondary text-xl mb-6 tracking-widest flex items-center">
                <span className="material-symbols-outlined mr-3">bolt</span> SKILL ORDER
              </h2>
              <div className="flex flex-wrap gap-2 text-2xl font-cinzel">
                {data.skillOrder.map((skill, index) => (
                  <Fragment key={index}>
                    <span className={`w-12 h-12 flex items-center justify-center ${skill === 'R' ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-surface-container-highest text-white'}`}>
                      {skill}
                    </span>
                    {index < data.skillOrder.length - 1 && <span className="text-surface-container-highest flex items-center">-</span>}
                  </Fragment>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
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
