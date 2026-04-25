import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Search, X } from 'lucide-react';
import type { Champion } from '../../types';
import { apiClient } from '../../api/client';

interface ChampionSearchProps {
  onSelect: (championId: string) => void;
  onClose: () => void;
  isDisabled?: (championId: string) => boolean;
}

export const ChampionSearch: FC<ChampionSearchProps> = ({ onSelect, onClose, isDisabled }) => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const { data } = await apiClient.get('/champions');
        setChampions(data);
      } catch (err) {
        console.error('Failed to load champions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChampions();
  }, []);

  const filtered = champions.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="tactical-card w-full max-w-2xl bg-surface h-[80vh] flex flex-col border border-surface-container-highest">

        <div className="flex justify-between items-center bg-surface-container-low p-4 border-b border-surface-container-highest">
          <h2 className="text-xl font-display text-primary uppercase tracking-widest">Select Champion</h2>
          <button onClick={onClose} className="text-surface-container-highest hover:text-tertiary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-surface-container-highest relative">
          <Search className="absolute left-7 top-7 text-secondary" size={20} />
          <input
            type="text"
            className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-secondary transition-colors outline-none py-3 pl-12 pr-4 text-on-surface"
            placeholder="Search champion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-t-primary border-r-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {filtered.map(champ => {
                const disabled = isDisabled ? isDisabled(champ.id) : false;
                return (
                  <div
                    key={champ.id}
                    className={`flex flex-col items-center group transition-transform ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    onClick={() => {
                      if (disabled) return;
                      onSelect(champ.id);
                      onClose();
                    }}
                  >
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champ.id === 'Fiddlesticks' ? 'FiddleSticks' : champ.id}_0.jpg`}
                      alt={champ.name}
                      className="w-14 h-14 object-cover border border-surface-container-highest group-hover:border-primary"
                    />
                    <span className="text-xs mt-1 text-center font-body truncate w-full text-surface-container-highest group-hover:text-primary">
                      {champ.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
