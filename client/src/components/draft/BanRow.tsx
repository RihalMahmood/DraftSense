import type { FC } from 'react';
import { useDraftStore } from '../../store/draftStore';
import type { Champion } from '../../types';

interface BanRowProps {
  onBanClick: (index: number) => void;
  championsMeta: Record<string, Champion>;
}

export const BanRow: FC<BanRowProps> = ({ onBanClick, championsMeta }) => {
  const bans = useDraftStore(state => state.bans);
  const setBan = useDraftStore(state => state.setBan);

  const getDDragonImg = (champId: string) => `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champId === 'Fiddlesticks' ? 'FiddleSticks' : champId}_0.jpg`;

  return (
    <>
      <div className="flex gap-2 p-2 bg-[#0a1420] border border-[#45ddfd]/20 shadow-[0_0_15px_rgba(69,221,253,0.1)]">
        {Array.from({ length: 5 }).map((_, idx) => {
          const champId = bans[idx];
          const champInfo = champId ? championsMeta[champId] : null;

          return (
            <div
              key={`blue-ban-${idx}`}
              onClick={() => onBanClick(idx)}
              className="w-12 h-12 bg-surface-container-low border border-dashed border-[#45ddfd]/30 relative overflow-hidden cursor-pointer hover:border-[#45ddfd] transition-colors"
            >
              {champInfo && (
                <div className="group/ban relative w-full h-full">
                  <img src={getDDragonImg(champInfo.id)} alt={champInfo.name} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center pointer-events-none"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBan(idx, null);
                    }}
                    title="Clear ban"
                    className="absolute inset-0 bg-red-900/80 opacity-0 group-hover/ban:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <span className="material-symbols-outlined text-white text-lg">close</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center">
        <span className="cinzel text-[#f0bf5c] text-xs font-bold tracking-widest">BANS</span>
        <div className="h-0.5 w-12 bg-gradient-to-r from-[#45ddfd] via-[#f0bf5c] to-[#ff7876]"></div>
      </div>

      <div className="flex gap-2 p-2 bg-[#0a1420] border border-[#ff7876]/20 shadow-[0_0_15px_rgba(255,120,118,0.1)]">
        {Array.from({ length: 5 }).map((_, idx) => {
          const absoluteIdx = idx + 5;
          const champId = bans[absoluteIdx];
          const champInfo = champId ? championsMeta[champId] : null;

          return (
            <div
              key={`red-ban-${idx}`}
              onClick={() => onBanClick(absoluteIdx)}
              className="w-12 h-12 bg-surface-container-low border border-dashed border-[#ff7876]/30 relative overflow-hidden cursor-pointer hover:border-[#ff7876] transition-colors"
            >
              {champInfo && (
                <div className="group/ban relative w-full h-full">
                  <img src={getDDragonImg(champInfo.id)} alt={champInfo.name} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center pointer-events-none"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBan(absoluteIdx, null);
                    }}
                    title="Clear ban"
                    className="absolute inset-0 bg-red-900/80 opacity-0 group-hover/ban:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <span className="material-symbols-outlined text-white text-lg">close</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
