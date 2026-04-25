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
  const setAllyPick = useDraftStore(state => state.setAllyPick);
  const setEnemyPick = useDraftStore(state => state.setEnemyPick);

  const roles: Role[] = ['top', 'jungle', 'mid', 'bot', 'support'];

  const titleColor = isBlue ? 'text-[#45ddfd]' : 'text-[#ff7876]';
  const titleText = isBlue ? 'YOUR TEAM' : 'ENEMY TEAM';
  const alignment = isBlue ? 'items-end' : 'items-start';
  const borderColor = isBlue ? 'border-[#45ddfd]/30' : 'border-[#ff7876]/30';
  const gradientDir = isBlue ? 'bg-gradient-to-l' : 'bg-gradient-to-r';
  //const iconColor = isBlue ? 'text-[#f0bf5c]' : 'text-[#45ddfd]';
  //const iconBorderOpacity = isBlue ? 'border-[#f0bf5c]/30 shadow-[0_0_10px_rgba(240,191,92,0.2)]' : 'border-[#45ddfd]/30 shadow-[0_0_10px_rgba(69,221,253,0.2)]';
  const nameColor = isBlue ? 'text-[#45ddfd]' : 'text-[#ff7876]';

  const getDDragonImg = (imageName: string) => `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${imageName}`;
  const getSplashImg = (champId: string) => `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champId}_0.jpg`;

  const getRoleIcon = (role: Role) => {
    const map: Record<string, string> = {
      top: 'Top_icon.png',
      jungle: 'Jungle_icon.png',
      mid: 'Middle_icon.png',
      bot: 'Bottom_icon.png',
      support: 'Support_icon.png'
    };
    return `/images/${map[role]}`;
  };

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
            {/*Background Splash Art*/}
            {champInfo && (
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-20 filter brightness-50 group-hover:opacity-40 transition-all duration-700 scale-110 group-hover:scale-100"
                style={{ objectPosition: 'center 20%' }}
                src={getSplashImg(champInfo.id)}
                alt=""
              />
            )}

            {/*Gradient Overlay*/}
            <div className={`absolute inset-0 ${gradientDir} from-transparent via-[#131c29]/90 to-[#131c29]`}></div>

            {/*Content Container*/}
            <div className={`absolute inset-0 flex items-center ${isBlue ? 'flex-row pl-8 pr-14' : 'flex-row-reverse pr-8 pl-14'} justify-between`}>

              {/*Role Indicator Square - Outer Position*/}
              <div className={`flex items-center justify-center w-10 h-10 border-2 border-opacity-30 bg-[#0a1420]/80 shrink-0 ${isBlue ? 'border-[#45ddfd]/30 shadow-[0_0_10px_rgba(69,221,253,0.1)]' : 'border-[#ff7876]/30 shadow-[0_0_10px_rgba(255,120,118,0.1)]'}`}>
                <img
                  src={getRoleIcon(role)}
                  alt={role}
                  className="w-6 h-6 object-contain opacity-80 brightness-110"
                />
              </div>

              {/*Text Info - Middle*/}
              <div className={`flex-1 ${isBlue ? 'text-left pl-6' : 'text-right pr-6'}`}>
                {champInfo ? (
                  <>
                    <div className={`cinzel text-xl font-black tracking-widest group-hover:text-white transition-colors ${nameColor} drop-shadow-md`}>
                      {champInfo.name.toUpperCase()}
                    </div>
                    <div className="sora text-[9px] text-white/50 uppercase tracking-[0.2em] font-semibold mt-0.5">
                      {isMe ? 'SYSTEM_LOCKED' : 'PICK_CONFIRMED'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`cinzel text-lg font-bold tracking-widest opacity-40 ${nameColor}`}>
                      {isMe ? 'SELECTING...' : 'WAITING...'}
                    </div>
                    <div className="sora text-[9px] text-[#A0B4C8]/40 uppercase tracking-[0.2em]">
                      {role}
                    </div>
                  </>
                )}
              </div>

              {/*Champion Portrait - Inner Position (towards divider)*/}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className={`w-14 h-14 bg-[#0a1420] border-2 ${isMe ? 'border-[#f0bf5c]' : borderColor} relative overflow-hidden shadow-2xl transition-transform duration-300 group-hover:scale-110 z-10`}>
                  {champInfo ? (
                    <>
                      <img
                        className="w-full h-full object-cover"
                        src={getDDragonImg(champInfo.image)}
                        alt={champInfo.name}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isBlue) setAllyPick(role, null);
                          else setEnemyPick(role, null);
                        }}
                        title="Clear pick"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0b1220]/80 flex items-center justify-center text-xs text-white hover:bg-red-600 transition-colors z-20"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className={`material-symbols-outlined text-2xl ${isMe ? 'text-[#f0bf5c] animate-pulse' : 'text-[#45ddfd]/20'}`}>
                        {isMe ? 'person_search' : 'add'}
                      </span>
                    </div>
                  )}
                </div>
                {/*Decorative Brackets for Portrait*/}
                <div className="absolute -inset-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bracket-tl !w-2 !h-2"></div>
                  <div className="bracket-tr !w-2 !h-2"></div>
                  <div className="bracket-bl !w-2 !h-2"></div>
                  <div className="bracket-br !w-2 !h-2"></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
