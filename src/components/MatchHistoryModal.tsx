import React, { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';
import { MatchHistoryEntry } from '../types/game.js';
import { api } from '../services/api.js';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({ isOpen, onClose }) => {
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getMatchHistory()
        .then(setMatches)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <History size={20} className="text-[#FFB800]" />
            <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">Suspecto Match History</h2>
          </div>
          <p className="text-xs text-[#9AA0AD]">
            Authoritative records of completed matches across all rooms.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#7B8290]">Loading match logs...</div>
        ) : matches.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7B8290]">
            No matches completed yet. Host a game and finish a round to record history!
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-[#0F1217] rounded-xl border border-[#28303F] hover:border-[#384252] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        m.winner === 'CREW'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30'
                      }`}
                    >
                      {m.winner === 'CREW' ? 'Crew Members Won' : 'Imposter Won'}
                    </span>
                    <span className="text-xs text-[#9AA0AD] font-mono">
                      Category: {m.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#7B8290] font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#E6E8EC]">
                  <div>
                    <span className="text-[11px] text-[#7B8290] block">Secret Word</span>
                    <span className="font-semibold text-[#E6E8EC]">{m.secretWord}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7B8290] block">Imposter(s)</span>
                    <span className="font-semibold text-[#FFB800]">
                      {m.imposters.map((imp) => imp.name).join(', ') || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#7B8290] block">Match Details</span>
                    <span className="text-[#9AA0AD]">
                      {m.playersCount} players · {m.durationSeconds}s
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
