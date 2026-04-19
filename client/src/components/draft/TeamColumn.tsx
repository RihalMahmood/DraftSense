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
  const sideColorClass = isBlue ? 'text-secondary' : 'text-tertiary';
  const sideBorderClass = isBlue ? 'border-secondary/30' : 'border-tertiary/30';
  const sideHoverBorder = isBlue ? 'hover:border-secondary' : 'hover:border-tertiary';

  return (
    <div className={`flex flex-col gap-3 w-full sm:w-64`}>
      <h3 className={`font-display text-2xl uppercase tracking-widest ${sideColorClass} mb-4 ${isBlue ? 'text-right' : 'text-left'}`}>
        {isBlue ? 'Ally Team' : 'Enemy Team'}
      </h3>

      {roles.map((role) => {
        const champId = picks[role];
        const champInfo = champId ? championsMeta[champId] : null;
        const isMe = isBlue && myRole === role;

        return (
          <div
            key={role}
            onClick={() => {
              if (!isMe) onPickClick(role, side);
            }}
            className={`
              relative h-20 bg-surface-container-low border ${sideBorderClass} 
              ${isMe ? 'opacity-50 cursor-not-allowed border-primary/50' : `cursor-pointer ${sideHoverBorder}`} 
              transition-all duration-300 flex items-center p-3
              ${isBlue ? 'flex-row-reverse' : 'flex-row'}
            `}
            style={{
              clipPath: isBlue
                ? 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                : 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
            }}
          >
            {/*Role Icon Area*/}
            <div className={`w-10 h-10 flex items-center justify-center border border-surface-container-highest bg-surface text-xs font-display text-white/50 ${isBlue ? 'ml-3' : 'mr-3'}`}>
              {role.substring(0, 3).toUpperCase()}
            </div>

            {/*Champion Details or Blank*/}
            <div className={`flex-1 flex flex-col justify-center ${isBlue ? 'text-right' : 'text-left'} overflow-hidden`}>
              {champInfo ? (
                <>
                  <span className="font-display text-white truncate text-lg tracking-wide">{champInfo.name}</span>
                  {isMe && <span className="text-[10px] text-primary uppercase font-bold tracking-widest mt-1">Your Pick</span>}
                </>
              ) : (
                <>
                  <span className="text-surface-container-highest uppercase text-sm font-bold tracking-widest">
                    {isMe ? 'Evaluating' : 'Selecting...'}
                  </span>
                  {isMe && <span className="text-[10px] text-primary uppercase font-bold tracking-widest mt-1">Your Role</span>}
                </>
              )}
            </div>

            {/*Background Champion Splash (simulated with standard square img object cover to the side)*/}
            {champInfo && (
              <div className={`absolute top-0 ${isBlue ? 'left-0' : 'right-0'} w-1/2 h-full -z-10 opacity-30 mask-image-gradient`}>
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champInfo.image}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className={`absolute inset-0 bg-linear-to-r ${isBlue ? 'from-secondary/5 to-transparent' : 'from-transparent to-tertiary/5'} opacity-0 hover:opacity-100 transition-opacity pointer-events-none`}></div>
          </div>
        );
      })}
    </div>
  );
};
