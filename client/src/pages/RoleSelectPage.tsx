import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import type { Role } from '../types';

export const RoleSelectPage: FC = () => {
  const navigate = useNavigate();
  const setMyRole = useDraftStore(state => state.setMyRole);

  const roles: { id: Role; label: string }[] = [
    { id: 'top', label: 'TOP LANE' },
    { id: 'jungle', label: 'JUNGLE' },
    { id: 'mid', label: 'MID LANE' },
    { id: 'bot', label: 'BOT LANE' },
    { id: 'support', label: 'SUPPORT' }
  ];

  const handleRoleSelect = (role: Role) => {
    setMyRole(role);
    navigate('/draft');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden">
      {/*Background Effects*/}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-linear-to-br from-[#0a1420] via-background to-[#120a1c] opacity-100"></div>
        <div className="absolute inset-0 hex-overlay opacity-30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary/5 blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 blur-[120px]"></div>
      </div>

      <div className="z-10 text-center mb-24">
        <h2 className="text-xs tracking-widest text-secondary mb-4 uppercase font-sora">Identify Your Vector</h2>
        <h1 className="text-7xl font-newsreader font-bold text-primary drop-shadow-[0_0_20px_rgba(240,191,92,0.3)] uppercase tracking-widest">
          SELECT YOUR<br />ROLE
        </h1>
      </div>

      <div className="z-10 grid grid-cols-2 lg:grid-cols-5 gap-8 max-w-6xl w-full">
        {roles.map((role, idx) => (
          <button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            className="group relative w-full bg-surface-container border border-outline-variant/30 transition-all duration-500 hover:border-primary/50 overflow-hidden flex flex-col items-center justify-center p-8 aspect-3/4 hover:scale-105 hover:-translate-y-2"
            style={{
              animation: `fadeInUp 0.6s ease backwards`,
              animationDelay: `${idx * 100}ms`
            }}
          >
            {/*Bracket decorations*/}
            <div className="bracket-tl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bracket-tr opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bracket-bl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bracket-br opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/*The warm glow on hover*/}
            <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/*Role Name*/}
            <span className="font-newsreader tracking-widest text-2xl text-secondary/60 group-hover:text-primary uppercase relative z-10 transition-colors duration-300 text-center">
              {role.label}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
