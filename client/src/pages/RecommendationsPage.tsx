import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraftStore } from '../store/draftStore';
import { apiClient } from '../api/client';
import type { RecommendationResponse, Champion } from '../types';

interface SectionProps {
  title: string;
  champs: Champion[];
  highlight?: 'primary' | 'secondary' | 'tertiary';
  onViewBuild: (champion: Champion) => void;
}

const Section = ({ title, champs, highlight, onViewBuild }: SectionProps) => {
  const highlightColor = highlight === 'primary' ? 'text-primary border-primary'
    : highlight === 'secondary' ? 'text-secondary border-secondary'
      : 'text-tertiary border-tertiary';

  return (
    <div className="mb-12">
      <h3 className={`font-display text-xl uppercase tracking-[0.15em] mb-6 flex items-center gap-4 ${highlightColor.split(' ')[0]}`}>
        <div className={`w-2 h-2 ${highlightColor.split(' ')[0].replace('text-', 'bg-')}`}></div>
        {title}
        <div className="flex-1 h-px bg-surface-container-low relative">
          <div className={`absolute top-0 left-0 h-full w-1/3 ${highlightColor.split(' ')[0].replace('text-', 'bg-')} opacity-30`}></div>
        </div>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {champs.map((champ, idx) => (
          <div
            key={champ.id}
            className="tactical-card group cursor-pointer hover:-translate-y-1"
            onClick={() => onViewBuild(champ)}
            style={{ animationDelay: `${idx * 100}ms`, animation: 'fadeInUp 0.5s ease backwards' }}
          >
            <div className="aspect-[3/4] relative overflow-hidden mb-4">
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`}
                alt={champ.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                  //Fallback to square if loading image isn't available
                  e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champ.image}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
              <h4 className="absolute bottom-3 left-3 text-2xl font-display text-white uppercase drop-shadow-lg group-hover:text-primary transition-colors">
                {champ.name}
              </h4>
            </div>
            <div className="px-2 pb-2">
              <p className="text-xs text-surface-container-highest group-hover:text-secondary transition-colors">
                VIEW TACTICAL BUILD &rarr;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export const RecommendationsPage: FC = () => {
  const navigate = useNavigate();
  const state = useDraftStore();

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.myRole) {
      navigate('/');
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const reqBody = {
          myRole: state.myRole,
          bans: state.bans.filter(Boolean),
          enemyPicks: state.enemyPicks,
          allyPicks: state.allyPicks
        };
        const res = await apiClient.post<RecommendationResponse>('/recommend', reqBody);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to query the tactical engine. Ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [state, navigate]);

  const viewBuild = (champion: Champion) => {
    //Navigate to build guide page with champion pre-selected
    navigate('/build', { state: { champion } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin"></div>
        <p className="mt-6 text-secondary font-display tracking-widest uppercase animate-pulse">Running Simulation...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col text-center p-6">
        <h2 className="text-tertiary text-2xl font-display mb-4">CRITICAL ERROR</h2>
        <p className="text-surface-container-highest mb-8 max-w-md">{error}</p>
        <button onClick={() => navigate('/draft')} className="btn-sovereign-ghost">RETURN TO DRAFT</button>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-baseline mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-display text-primary uppercase tracking-[0.1em]">Recommended Vanguards</h1>
            <p className="text-surface-container-highest tracking-widest uppercase mt-2">Analysis complete. Proceed with selection.</p>
          </div>
          <button onClick={() => navigate('/draft')} className="btn-sovereign-ghost text-sm">REVISE DRAFT</button>
        </div>

        <Section title="Optimal Overall Picks" champs={data.overallBest || []} highlight="primary" onViewBuild={viewBuild} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 xl:gap-8">
          <div>
            <Section title="Counter Measures (Enemy Favored)" champs={data.counterPicks || []} highlight="tertiary" onViewBuild={viewBuild} />
          </div>
          <div>
            <Section title="Synergy Network (Ally Favored)" champs={data.synergyPicks || []} highlight="secondary" onViewBuild={viewBuild} />
          </div>
        </div>

      </div>
    </div>
  );
};

//Required for the inline animation defined above
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
