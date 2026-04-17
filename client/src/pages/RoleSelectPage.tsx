import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import type { Role } from '../types';

export const RoleSelectPage: FC = () => {
  const navigate = useNavigate();
  const setMyRole = useDraftStore(state => state.setMyRole);

  const roles: { id: Role; label: string; icon: string }[] = [
    { id: 'top', label: 'Top Lane', icon: 'M' },  //using a placeholder char for icon since we don't have SVG paths readily handy
    { id: 'jungle', label: 'Jungle', icon: 'J' },
    { id: 'mid', label: 'Mid Lane', icon: 'M' },
    { id: 'bot', label: 'Bot Lane', icon: 'B' },
    { id: 'support', label: 'Support', icon: 'S' }
  ];

  const handleRoleSelect = (role: Role) => {
    setMyRole(role);
    navigate('/draft');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[url('/bg-texture.png')] bg-cover bg-center">
      {/*Hexagonal overlay grid pattern typical for the Sovereign's War Room design*/}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0BC4E3 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background via-transparent to-background pointer-events-none"></div>

      <div className="z-10 text-center mb-12">
        <h2 className="text-sm tracking-[0.2em] text-secondary mb-2 uppercase font-body">Identify Your Vector</h2>
        <h1 className="text-5xl md:text-7xl font-display text-primary drop-shadow-[0_0_20px_rgba(240,191,92,0.3)]">
          SELECT YOUR<br />ROLE
        </h1>
      </div>

      <div className="z-10 grid grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl w-full">
        {roles.map((r, idx) => (
          <button
            key={r.id}
            onClick={() => handleRoleSelect(r.id)}
            className="group relative w-full aspect-[3/4] bg-surface-container-low border border-surface-container-highest transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:border-primary/50 overflow-hidden flex flex-col items-center justify-center"
            style={{
              clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
              animationDelay: `${idx * 100}ms`
            }}
          >
            {/*The warm glow on hover*/}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="text-4xl text-surface-container-highest group-hover:text-primary transition-colors duration-300 font-display mb-4 p-4 border border-surface-container-highest rounded-full group-hover:border-primary/50">
              {r.icon}
            </div>

            <span className="font-display tracking-widest text-lg text-white/50 group-hover:text-white uppercase relative z-10 transition-colors duration-300">
              {r.label}
            </span>

            {/*Gold brackets inside the card*/}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        ))}
      </div>
    </div>
  );
};
