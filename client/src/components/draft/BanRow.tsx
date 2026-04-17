import type { FC } from 'react';
import { useDraftStore } from '../../store/draftStore';
import type { Champion } from '../../types';

interface BanRowProps {
  onBanClick: (index: number) => void;
  championsMeta: Record<string, Champion>;
}

export const BanRow: FC<BanRowProps> = ({ onBanClick, championsMeta }) => {
  const bans = useDraftStore(state => state.bans);

  return (
    <div className="flex flex-col items-center mb-8">
      <h3 className="text-tertiary font-body uppercase tracking-widest text-xs mb-3">Targeted Bans</h3>
      <div className="flex gap-2 bg-surface-container-low p-2 border border-surface-container-highest">
        {Array.from({ length: 10 }).map((_, i) => {
          const isRedSide = i >= 5;
          const champId = bans[i];
          const champInfo = champId ? championsMeta[champId] : null;

          return (
            <div
              key={i}
              className={`relative ${isRedSide && i === 5 ? 'ml-8' : ''}`}
            >
              <div
                onClick={() => onBanClick(i)}
                className={`w-12 h-12 flex items-center justify-center cursor-pointer border ${champInfo ? 'border-tertiary' : 'border-surface-container-highest border-dashed hover:border-tertiary/50'} transition-colors overflow-hidden group`}
                style={{ clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)' }}
              >
                {champInfo ? (
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champInfo.image}`}
                    alt={champInfo.name}
                    className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                  />
                ) : (
                  <span className="text-surface-container-highest text-lg group-hover:text-tertiary/50">X</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
