import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import type { Role } from '../types';
import { useState } from 'react';

export const RoleSelectPage: FC = () => {
  const navigate = useNavigate();
  const setMyRole = useDraftStore(state => state.setMyRole);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles: { id: Role; label: string; icon: string; desc: string }[] = [
    { id: 'top', label: 'TOP', icon: '/images/Top_icon.png', desc: 'SOLO LANE CARRY' },
    { id: 'jungle', label: 'JUNGLE', icon: '/images/Jungle_icon.png', desc: 'MAP CONTROL' },
    { id: 'mid', label: 'MID', icon: '/images/Middle_icon.png', desc: 'BURST DAMAGE' },
    { id: 'bot', label: 'BOT', icon: '/images/Bottom_icon.png', desc: 'SUSTAINED DPS' },
    { id: 'support', label: 'SUPPORT', icon: '/images/Support_icon.png', desc: 'UTILITY TANK' }
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      setMyRole(selectedRole);
      navigate('/draft');
    }
  };

  return (
    <div className="bg-[#030b17] text-on-background font-body overflow-hidden min-h-screen">
      {/*Atmospheric Background Layers*/}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center opacity-15 blur-[20px] scale-110"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKJvJ-pjjfbPvfUa2i-y7I-GztHgpzqDwTCaLeB7WtzO6MstyBPZJl0vv5ddImueqj2Ab7eSoQ4FGrLlMrYR3etYDyzguyays5DtSsXrVYUsLxfQkEQuJCxwtHcgwf9NmuDqsda7MBFia4XQxq7MEuI8XFsgXv_x6CBgkr6HcBRZs6cHwWFl1vRfj4QAVHtDTiiWu4GHJvWf0UhI6f2qaqoEeT8Pzi9RFnWQZubN0UdeKvcT8l7mU8HscZjaxhnzy6DhPdjQxKqb82')" }}>
        </div>
        <div className="absolute inset-0 vignette"></div>
        <div className="absolute inset-0 hex-grid"></div>
        {/*Subtle Golden Dust Motes*/}
        <div className="dust-particle w-1 h-1 top-[20%] left-[10%]"></div>
        <div className="dust-particle w-1.5 h-1.5 top-[60%] left-[80%]"></div>
        <div className="dust-particle w-0.5 h-0.5 top-[30%] left-[40%]"></div>
        <div className="dust-particle w-1 h-1 top-[80%] left-[25%]"></div>
      </div>

      {/*Main Content Shell*/}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[884px] h-screen px-4 space-y-16">
        {/*Header Section*/}
        <header className="text-center flex flex-col items-center">
          <img
            src="/images/DraftSense.png"
            alt="DraftSense Logo"
            className="w-full max-w-[600px] h-auto drop-shadow-[0_0_20px_rgba(240,191,92,0.3)] animate-float"
          />
          <p className="font-sora text-base md:text-[16px] text-[#A0B4C8] mt-2 tracking-[0.1em] opacity-80 uppercase">
            Your AI-powered champion draft advisor
          </p>
          <div className="w-32 h-[1px] bg-primary-container/40 mx-auto mt-8"></div>
        </header>

        {/*Role Selection Container*/}
        <section className="flex flex-col items-center w-full max-w-6xl">
          <h2 className="font-cinzel text-[13px] text-primary tracking-[0.3em] mb-12 opacity-90">
            SELECT YOUR ROLE
          </h2>

          {/*Horizontal Role Cards Grid*/}
          <div className="flex flex-wrap justify-center gap-6">
            {roles.map(role => {
              const isActive = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`role-card group relative w-[120px] h-[180px] flex flex-col items-center justify-center transition-all duration-300 outline-none
                          ${isActive ? 'bg-surface-container-highest border border-primary/40 focus:-translate-y-2 ring-1 ring-primary/20 scale-105 -translate-y-2 shadow-[0_0_30px_rgba(240,191,92,0.25)]'
                      : 'bg-[#0F2043] border border-[#1E3A5F] hover:-translate-y-2 hover:bg-[#132a58] hover:shadow-[0_0_30px_rgba(240,191,92,0.15)] focus:ring-1 focus:ring-primary/50'}`}
                >
                  {isActive ? (
                    <>
                      <div className="angular-bracket-tl"></div>
                      <div className="angular-bracket-tr"></div>
                      <div className="angular-bracket-bl"></div>
                      <div className="angular-bracket-br"></div>
                    </>
                  ) : (
                    <>
                      <div className="angular-bracket-tl hidden group-hover:block opacity-30"></div>
                      <div className="angular-bracket-tr hidden group-hover:block opacity-30"></div>
                      <div className="angular-bracket-bl hidden group-hover:block opacity-30"></div>
                      <div className="angular-bracket-br hidden group-hover:block opacity-30"></div>
                    </>
                  )}
                  <img
                    src={role.icon}
                    alt={role.label}
                    className={`w-12 h-12 mb-4 object-contain transition-transform duration-300 ${isActive ? 'scale-110 brightness-125' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}
                  />
                  <span className={`font-cinzel text-sm tracking-[0.1em] mb-1 ${isActive ? 'text-primary' : 'text-on-background'}`}>{role.label}</span>
                  <span className="font-body text-[10px] text-[#A0B4C8] text-center px-2">{role.desc}</span>
                </button>
              );
            })}
          </div>

          {/*Action Button*/}
          <div className="mt-20 w-full flex justify-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedRole}
              className={`cut-corner w-full max-w-[320px] h-14 font-cinzel text-sm font-bold tracking-[0.2em] px-12 transition-all duration-200 
                      ${selectedRole ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary hover:scale-105 hover:brightness-110 active:scale-95 shadow-[0_0_40px_rgba(240,191,92,0.2)]'
                  : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50'}`}
            >
              CONFIRM ROLE
            </button>
          </div>
        </section>

        {/*Footer Info*/}
        <footer className="absolute bottom-8 text-center w-full">
          <p className="font-body text-[11px] text-[#A0B4C8]/50 tracking-[0.1em] uppercase">
            Powered by Ollama AI • Data from Riot Data Dragon
          </p>
        </footer>
      </main>
    </div>
  );
};
