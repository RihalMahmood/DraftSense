import type { FC } from 'react';
import { useDraftStore } from '../../store/draftStore';
import type { Champion, Role } from '../../types';

interface TeamColumnProps {
  side: 'blue' | 'red';
  onPickClick: (role: Role, side: 'blue' | 'red') => void;
  championsMeta: Record<string, Champion>;
}

export const TeamColumn: FC<TeamColumnProps> = ({ side, onPickClick, championsMeta }) => {
  const isBlue = side === 'blue';
  const picks = useDraftStore(state => isBlue ? state.allyPicks : state.enemyPicks);
  const myRole = useDraftStore(state => state.myRole);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];
  
  const titleColor = isBlue ? 'text-[#45ddfd]' : 'text-[#ff7876]';
  const titleText = isBlue ? 'YOUR TEAM' : 'ENEMY TEAM';
  const alignment = isBlue ? 'items-end' : 'items-start';
  const borderColor = isBlue ? 'border-[#45ddfd]/30' : 'border-[#ff7876]/30';
  const gradientDir = isBlue ? 'bg-gradient-to-l' : 'bg-gradient-to-r';
  const iconColor = isBlue ? 'text-[#f0bf5c]' : 'text-[#45ddfd]';
  const iconBorderOpacity = isBlue ? 'border-[#f0bf5c]/30 shadow-[0_0_10px_rgba(240,191,92,0.2)]' : 'border-[#45ddfd]/30 shadow-[0_0_10px_rgba(69,221,253,0.2)]';
  const nameColor = isBlue ? 'text-[#45ddfd]' : 'text-[#ff7876]';

  const getDDragonImg = (imageName: string) => `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${imageName}`;

  return (
    <div className={`flex flex-col gap-3 p-4 ${alignment}`}>
      <h2 className={`cinzel text-xl tracking-widest mb-2 ${titleColor} ${isBlue ? 'pr-4' : 'pl-4'}`}>
        {titleText}
      </h2>

      {roles.map((role) => {
        const champId = picks[role];
        const champInfo = champId ? championsMeta[champId] : null;
        const isMe = isBlue && myRole === role;

        return (
          <div
            key={role}
            onClick={() => onPickClick(role, side)}
            className={`w-full max-w-[400px] h-20 bg-[#131c29] border ${borderColor} relative overflow-hidden group cursor-pointer clip-path-polygon ${isMe && !champInfo ? 'animate-pulse' : ''}`}
          >
            {champInfo && (
              <img 
                className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-60 transition-all duration-500" 
                src={getDDragonImg(champInfo.image)} 
                alt={champInfo.name}
              />
            )}
            
            <div className={`absolute inset-0 ${gradientDir} from-transparent via-[#131c29]/80 to-[#131c29]`}></div>
            
            <div className={`absolute inset-0 flex items-center p-4 ${isBlue ? 'justify-start' : 'justify-end'}`}>
              
              {isBlue && (
                <div className={`flex items-center justify-center w-10 h-10 border ${iconBorderOpacity} bg-[#0a1420]/80 shrink-0`}>
                  <span className={`font-cinzel text-xs font-bold tracking-widest ${iconColor}`}>
                    {role.substring(0,3).toUpperCase()}
                  </span>
                </div>
              )}

              <div className={isBlue ? 'ml-4 text-left' : 'mr-4 text-right'}>
                {champInfo ? (
                  <>
                    <div className={`cinzel text-lg font-bold tracking-wider group-hover:text-white transition-colors ${nameColor}`}>
                      {champInfo.name.toUpperCase()}
                    </div>
                    <div className="sora text-[10px] text-[#A0B4C8] uppercase tracking-widest">
                      {isMe ? 'YOUR CHAMPION' : 'LOCKED'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`cinzel text-lg font-bold tracking-wider opacity-50 ${nameColor}`}>
                      {isMe ? 'SELECTING...' : 'WAITING...'}
                    </div>
                    <div className="sora text-[10px] text-[#A0B4C8] uppercase tracking-widest opacity-50">
                      {role}
                    </div>
                  </>
                )}
              </div>

              {!isBlue && (
                <div className={`flex items-center justify-center w-10 h-10 border ${iconBorderOpacity} bg-[#0a1420]/80 shrink-0`}>
                  <span className={`font-cinzel text-xs font-bold tracking-widest ${iconColor}`}>
                    {role.substring(0,3).toUpperCase()}
                  </span>
                </div>
              )}
              
            </div>
          </div>
        );
      })}
    </div>
  );
};
