import type { FC } from 'react';
import type { Champion } from '../../types';

interface ChampionCardProps {
  champion: Champion | null;
  role?: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ChampionCard: FC<ChampionCardProps> = ({ champion, role, onClick, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  if (!champion) {
    return (
      <div
        onClick={onClick}
        className={`relative ${sizeClasses[size]} rounded-full border-2 border-dashed border-surface-container-highest flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${className}`}
      >
        <span className="text-xl text-surface-container-highest">+</span>
        {role && (
          <div className="absolute -bottom-2 -right-2 bg-surface-container-highest rounded-full p-1 border border-background">
            <span className="text-[10px] uppercase text-secondary">{role.substring(0, 3)}</span>
          </div>
        )}
      </div>
    );
  }

  const imageUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champion.id === 'Fiddlesticks' ? 'FiddleSticks' : champion.id}_0.jpg`;

  return (
    <div className={`cursor-pointer group ${className}`} onClick={onClick}>
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all`}>
        <img src={imageUrl} alt={champion.name} className="w-full h-full object-cover" />
      </div>
      <p className="text-center text-sm font-display mt-2 tracking-wider truncate w-20">{champion.name}</p>
    </div>
  );
};
