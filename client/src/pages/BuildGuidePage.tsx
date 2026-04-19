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
      <div className="min-h-screen bg-[#030B17] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-t-2 border-r-2 border-primary border-solid rounded-full animate-spin flex items-center justify-center">
          <div className="w-16 h-16 border-b-2 border-l-2 border-secondary border-solid rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-8 text-on-surface-variant font-rajdhani uppercase tracking-[0.2em] animate-pulse">Synthesizing Loadout for {selectedChampion?.name || 'Unknown'}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030B17] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-tertiary text-2xl font-cinzel uppercase tracking-widest mb-4">CRITICAL ERROR</h2>
        <p className="text-on-surface-variant mb-8 font-body">{error}</p>
        <button onClick={() => navigate('/recommendations')}
          className="bg-surface-container border border-primary/40 text-primary font-cinzel px-8 py-3 tracking-widest uppercase hover:bg-primary/10 transition-colors">
          RETURN TO RECOMMENDATIONS
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#030B17] text-on-surface font-body min-h-screen overflow-x-hidden flex flex-col selection:bg-primary selection:text-on-primary">
      {/*Background Effects*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1420] via-[#030B17] to-[#120a1c] opacity-100"></div>
        <div className="absolute inset-0 hex-grid opacity-30"></div>
      </div>

      {/*Top Navigation*/}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0a1420] shadow-[0_0_32px_0_rgba(3,11,23,0.4)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1920px] mx-auto relative">
          <div className="text-2xl font-bold tracking-[0.1em] text-[#f0bf5c] uppercase font-newsreader">
            SOVEREIGN TACTICS
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a className="text-slate-400 font-medium hover:text-[#45ddfd] transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">ROLE</a>
            <a className="text-slate-400 font-medium hover:text-[#45ddfd] transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">DRAFT</a>
            <a className="text-slate-400 font-medium hover:text-[#45ddfd] transition-colors duration-200 font-label uppercase tracking-widest text-xs" href="#">PICKS</a>
            <a className="text-[#f0bf5c] border-b-2 border-[#f0bf5c] pb-1 transition-all duration-300 font-label uppercase tracking-widest text-xs" href="#">BUILD</a>
          </nav>
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-primary cursor-pointer hover:text-secondary transition-colors">account_circle</span>
            <span className="material-symbols-outlined text-primary cursor-pointer hover:text-secondary transition-colors">settings</span>
          </div>
          <div className="bg-gradient-to-r from-transparent via-[#f0bf5c]/20 to-transparent h-[1px] w-full absolute bottom-0 left-0"></div>
        </div>
      </header>

      {/*Side Navigation*/}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a1420] border-r border-[#f0bf5c]/10 flex flex-col py-8 z-40 pt-24 hidden lg:flex shadow-[32px_0_32px_rgba(3,11,23,0.4)]">
        <div className="px-6 mb-8 flex items-center space-x-4">
          <div className="w-12 h-12 border-2 border-primary overflow-hidden">
            <img
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${selectedChampion.image}`}
              alt={selectedChampion.name}
            />
          </div>
          <div>
            <div className="font-newsreader font-black text-primary tracking-widest text-lg leading-tight">{selectedChampion.name.toUpperCase()}</div>
            <div className="text-[10px] text-slate-500 font-label uppercase tracking-[0.2em]">{selectedChampion.title || 'Tactical Asset'}</div>
          </div>
        </div>
        <nav className="flex-grow">
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-[#45ddfd] hover:bg-[#131c29] transition-all duration-300 group" href="#">
            <span className="material-symbols-outlined">auto_fix_high</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Runes</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 bg-gradient-to-r from-[#f0bf5c]/10 to-transparent border-l-4 border-[#f0bf5c] text-[#f0bf5c]" href="#">
            <span className="material-symbols-outlined">swords</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Items</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-[#45ddfd] hover:bg-[#131c29] transition-all duration-300" href="#">
            <span className="material-symbols-outlined">bolt</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Skills</span>
          </a>
          <a className="flex items-center px-6 py-4 space-x-4 text-slate-500 hover:text-[#45ddfd] hover:bg-[#131c29] transition-all duration-300" href="#">
            <span className="material-symbols-outlined">gavel</span>
            <span className="font-label uppercase tracking-widest text-[10px]">Matchups</span>
          </a>
        </nav>
        <div className="px-6 mt-auto">
          <button className="w-full bg-primary py-3 text-on-primary font-bold tracking-widest text-[10px] uppercase transition-all duration-300 hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20">
            SAVE BUILD
          </button>
        </div>
      </aside>

      <main className="lg:pl-64 pt-16 flex-1">
        {/*Hero Header*/}
        <section className="relative h-[300px] overflow-hidden flex items-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedChampion.id}_0.jpg')`
            }}
          ></div>
          <div className="absolute inset-0 bg-[#030B17] opacity-85"></div>
          <div className="absolute inset-0 hex-overlay opacity-30"></div>
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
                <h1 className="text-6xl font-cinzel text-primary tracking-widest uppercase drop-shadow-lg">{selectedChampion.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-[10px] font-bold tracking-[0.3em] uppercase">{draftState.myRole?.toUpperCase()}</span>
                  <span className="text-slate-400 text-sm italic font-newsreader opacity-80 tracking-wide">Build guide vs. meta opponents</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Content Grid*/}
        <div className="max-w-6xl mx-auto px-8 py-12 grid grid-cols-12 gap-8">
          {/*SECTION 1: RUNES*/}
          <section className="col-span-12 lg:col-span-5">
            <div className="bg-[#091428] relative p-6 border-t-[3px] border-primary h-full">
              <div className="angular-bracket-tl"></div>
              <div className="angular-bracket-tr"></div>
              <div className="angular-bracket-bl"></div>
              <div className="angular-bracket-br"></div>

              <h2 className="font-cinzel text-primary text-xl mb-8 tracking-widest flex items-center">
                <span className="material-symbols-outlined mr-3">auto_fix_high</span> RUNE PAGE
              </h2>
              <div className="grid grid-cols-2 gap-8">
                {/*Primary Path*/}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-primary">
                    <span className="material-symbols-outlined">bolt</span>
                    <span className="font-label font-black text-[10px] tracking-[0.2em] uppercase">{data.runes.primary.path}</span>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center p-1 border-2 border-primary shadow-[0_0_15px_rgba(240,191,92,0.4)]">
                      <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>award_star</span>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      {data.runes.primary.keystones.map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border border-primary/40 flex items-center justify-center bg-surface-container shadow-[0_0_10px_rgba(240,191,92,0.2)]">
                          <span className="material-symbols-outlined text-primary text-xl">stat_1</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/*Secondary Path*/}
                <div className="space-y-6 border-l border-white/5 pl-8">
                  <div className="flex items-center space-x-2 text-secondary">
                    <span className="material-symbols-outlined">target</span>
                    <span className="font-label font-black text-[10px] tracking-[0.2em] uppercase">{data.runes.secondary.path}</span>
                  </div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex flex-col space-y-4">
                      {data.runes.secondary.keystones.map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-secondary flex items-center justify-center bg-secondary/10">
                          <span className="material-symbols-outlined text-secondary text-xl">offline_bolt</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/*Shards*/}
              <div className="pt-8 space-y-3">
                <div className="flex space-x-4 justify-center">
                  <div className="w-6 h-6 rotate-45 border border-primary/40 bg-primary/20 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-primary">+10</div>
                  </div>
                  <div className="w-6 h-6 rotate-45 border border-primary/40 bg-primary/20 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-primary">+10</div>
                  </div>
                  <div className="w-6 h-6 rotate-45 border border-secondary/40 bg-secondary/10 flex items-center justify-center">
                    <div className="-rotate-45 text-[8px] font-bold text-secondary">+6</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/*SECTION 2: ITEM BUILD*/}
          <section className="col-span-12 lg:col-span-7">
            <div className="bg-[#091428] relative p-6 border-t-[3px] border-primary h-full">
              <div className="angular-bracket-tl"></div>
              <div className="angular-bracket-tr"></div>
              <div className="angular-bracket-bl"></div>
              <div className="angular-bracket-br"></div>

              <h2 className="font-cinzel text-primary text-xl mb-6 tracking-widest flex items-center">
                <span className="material-symbols-outlined mr-3">shopping_cart</span> ITEM BUILD ORDER
              </h2>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-4">STARTER</p>
                  <div className="flex space-x-4">
                    {data.itemBuild.starter.map((item, i) => (
                      <div key={i} className="flex items-center bg-[#131c29] p-2 pr-4 space-x-3 border-l-2 border-slate-600 shadow-lg"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}>
                        <div className="w-10 h-10 bg-slate-700 flex items-center justify-center text-[8px] text-center font-bold p-1 uppercase leading-tight italic overflow-hidden">
                          {item}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#dae3f5]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-label text-primary uppercase tracking-[0.2em] mb-4">CORE BUILD</p>
                  <div className="flex space-x-6 items-end flex-wrap gap-y-8">
                    {data.itemBuild.core.map((item, i) => (
                      <Fragment key={i}>
                        <div className="relative group">
                          <div className="absolute -top-3 -left-2 bg-primary text-on-primary w-5 h-5 flex items-center justify-center font-bold z-10 text-xs shadow-lg">{i + 1}</div>
                          <div className="w-20 h-20 border-2 border-primary overflow-hidden bg-[#0a1420] shadow-[0_0_15px_rgba(240,191,92,0.2)]"
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}>
                            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-[10px] p-2 text-center font-bold italic uppercase leading-tight">
                              {item}
                            </div>
                          </div>
                          <div className="text-center mt-2 font-rajdhani text-primary font-bold tracking-widest uppercase">3100g</div>
                        </div>
                        {i < data.itemBuild.core.length - 1 && <span className="material-symbols-outlined text-slate-600 self-center pb-8 hidden sm:block">arrow_forward</span>}
                      </Fragment>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-label text-secondary uppercase tracking-[0.2em] mb-4">SITUATIONAL</p>
                  <div className="flex flex-wrap gap-4">
                    {data.itemBuild.situational.map((item, i) => (
                      <div key={i} className="w-14 h-14 border border-secondary/40 bg-[#131c29] flex items-center justify-center text-[8px] p-1 text-center font-bold text-slate-400 hover:border-secondary hover:text-secondary opacity-70 hover:opacity-100 transition-all cursor-help italic">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/*SKILLS SECTION*/}
          <section className="col-span-12">
            <div className="bg-[#091428] relative p-8 border-t-[3px] border-primary h-full">
              <div className="angular-bracket-tl"></div>
              <div className="angular-bracket-tr"></div>
              <div className="angular-bracket-bl"></div>
              <div className="angular-bracket-br"></div>

              <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
                <h2 className="font-cinzel text-primary text-xl tracking-widest flex items-center">
                  <span className="material-symbols-outlined mr-3">bolt</span> SKILL ORDER
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-label text-slate-500 tracking-[0.2em] uppercase">MAX PRIORITY:</span>
                  <span className="font-cinzel text-2xl text-primary tracking-[0.3em]">
                    {Array.from(new Set(data.skillOrder.filter(s => s !== 'R'))).slice(0, 3).join(' > ')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="min-w-[800px] flex flex-wrap gap-3">
                  {data.skillOrder.map((skill, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <span className="text-[8px] text-slate-500 font-bold">{index + 1}</span>
                      <div className={`w-10 h-10 flex items-center justify-center font-cinzel text-xl font-bold shadow-lg
                        ${skill === 'R' ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-[#131c29] text-white border border-white/10'}`}
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)' }}>
                        {skill}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/*STRATEGY SECTION*/}
          <section className="col-span-12">
            <div className="bg-[#060F1E] p-8 border border-[#f0bf5c]/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-9xl">lightbulb</span>
              </div>
              <h2 className="font-cinzel text-primary text-xl mb-8 tracking-widest flex items-center uppercase">
                <span className="material-symbols-outlined mr-3">auto_stories</span> Strategy Protocols
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
                {data.tips.slice(0, 3).map((tip, i) => (
                  <div key={i} className="space-y-4">
                    <h3 className="font-newsreader font-bold text-secondary flex items-center text-lg uppercase tracking-wider">
                      <span className="material-symbols-outlined mr-2">
                        {i === 0 ? 'alarm' : i === 1 ? 'military_tech' : 'trophy'}
                      </span>
                      {i === 0 ? 'EARLY PHASE' : i === 1 ? 'TACTICAL SHIFT' : 'DOMINANCE'}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-[#f0bf5c]/20 pl-4">
                      "{tip}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/*Footer Spacer*/}
        <div className="h-24"></div>
      </main>
    </div>
  );
};
