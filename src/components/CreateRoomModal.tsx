import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import { RoomSettings } from '../types/game.js';
import { useAuth } from '../context/AuthContext.js';
import { useGame } from '../context/GameContext.js';
import { api } from '../services/api.js';
import { Logo } from './Logo.js';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth?: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRequireAuth }) => {
  const { user } = useAuth();
  const { joinRoom } = useGame();

  const [maxPlayers, setMaxPlayers] = useState(8);
  const [impostersCount, setImpostersCount] = useState(1);
  const [drawingTimeSeconds, setDrawingTimeSeconds] = useState(30);
  const [drawingRounds, setDrawingRounds] = useState(1);
  const [votingTimeSeconds, setVotingTimeSeconds] = useState(30);
  const [allowLateJoin, setAllowLateJoin] = useState(false);
  const [imposterFinalGuess, setImposterFinalGuess] = useState(true);
  const [wordCategory, setWordCategory] = useState('All');
  const [isPrivate] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-sm bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex justify-center mb-3">
            <Logo size="sm" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#E6E8EC] mb-2">Account Required to Host</h2>
          <p className="text-xs text-[#9AA0AD] mb-6 leading-relaxed">
            You must be logged in to create and host Suspecto game rooms. Sign in or register to get started!
          </p>
          <button
            onClick={() => {
              onClose();
              if (onRequireAuth) onRequireAuth();
            }}
            className="w-full py-3 px-4 bg-[#FFB800] hover:bg-[#FFC425] text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-md"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const settings: RoomSettings = {
        maxPlayers,
        impostersCount,
        drawingTimeSeconds,
        drawingRounds,
        votingTimeSeconds,
        allowLateJoin,
        imposterFinalGuess,
        wordCategory,
        isPrivate,
      };

      const result = await api.createRoom({
        hostPlayerId: user.id,
        hostUsername: user.username,
        hostAvatar: user.avatar,
        hostUserId: user.id,
        settings,
      });

      // Join the newly created room immediately!
      await joinRoom(result.roomId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create room.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'All', label: 'Random Mix (All)' },
    { id: 'Animals', label: 'Animals' },
    { id: 'Food', label: 'Food & Treats' },
    { id: 'Objects', label: 'Everyday Objects' },
    { id: 'Places', label: 'Landmarks & Places' },
    { id: 'Characters', label: 'Movies & Characters' },
    { id: 'Sports', label: 'Sports & Games' },
    { id: 'Everyday', label: 'Household Items' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sliders size={20} className="text-[#FFB800]" />
            <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">Host New Game Room</h2>
          </div>
          <p className="text-xs text-[#9AA0AD]">
            Configure match rules, turn timers, and the secret word category for your room.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#E63946]/10 border border-[#E63946]/30 text-xs text-[#E63946]">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Word Category */}
          <div>
            <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
              Word Category
            </label>
            <select
              value={wordCategory}
              onChange={(e) => setWordCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0F1217] text-[#E6E8EC]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Players & Imposters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
                Max Capacity
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] cursor-pointer"
              >
                {[3, 4, 5, 6, 8, 10, 12].map((num) => (
                  <option key={num} value={num} className="bg-[#0F1217] text-[#E6E8EC]">
                    {num} Players
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
                Imposter Count
              </label>
              <select
                value={impostersCount}
                onChange={(e) => setImpostersCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] cursor-pointer"
              >
                <option value={1} className="bg-[#0F1217] text-[#E6E8EC]">1 Imposter</option>
                <option value={2} className="bg-[#0F1217] text-[#E6E8EC]">2 Imposters (Recommended 6+)</option>
              </select>
            </div>
          </div>

          {/* Timers & Rounds */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
                Drawing Time
              </label>
              <select
                value={drawingTimeSeconds}
                onChange={(e) => setDrawingTimeSeconds(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-xs text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] cursor-pointer"
              >
                <option value={15} className="bg-[#0F1217] text-[#E6E8EC]">15s (Speed)</option>
                <option value={30} className="bg-[#0F1217] text-[#E6E8EC]">30s (Default)</option>
                <option value={45} className="bg-[#0F1217] text-[#E6E8EC]">45s (Casual)</option>
                <option value={60} className="bg-[#0F1217] text-[#E6E8EC]">60s (Master)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
                Draw Rounds
              </label>
              <select
                value={drawingRounds}
                onChange={(e) => setDrawingRounds(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-xs text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] cursor-pointer"
              >
                <option value={1} className="bg-[#0F1217] text-[#E6E8EC]">1 Round</option>
                <option value={2} className="bg-[#0F1217] text-[#E6E8EC]">2 Rounds</option>
                <option value={3} className="bg-[#0F1217] text-[#E6E8EC]">3 Rounds</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5">
                Voting Time
              </label>
              <select
                value={votingTimeSeconds}
                onChange={(e) => setVotingTimeSeconds(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-xs text-[#E6E8EC] focus:outline-none focus:border-[#FFB800] cursor-pointer"
              >
                <option value={20} className="bg-[#0F1217] text-[#E6E8EC]">20s</option>
                <option value={30} className="bg-[#0F1217] text-[#E6E8EC]">30s</option>
                <option value={45} className="bg-[#0F1217] text-[#E6E8EC]">45s</option>
                <option value={60} className="bg-[#0F1217] text-[#E6E8EC]">60s</option>
              </select>
            </div>
          </div>

          {/* Special Game Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-[#28303F]">
            <label className="flex items-center justify-between p-2.5 bg-[#0F1217] rounded-xl border border-[#28303F] cursor-pointer hover:border-[#384252] transition-colors">
              <div>
                <span className="text-xs font-semibold text-[#E6E8EC] block">
                  Imposter Final Guess
                </span>
                <span className="text-[11px] text-[#9AA0AD] block">
                  If caught, the imposter gets 1 chance to steal victory by guessing the secret word.
                </span>
              </div>
              <input
                type="checkbox"
                checked={imposterFinalGuess}
                onChange={(e) => setImposterFinalGuess(e.target.checked)}
                className="w-4 h-4 rounded text-[#FFB800] accent-[#FFB800] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-[#0F1217] rounded-xl border border-[#28303F] cursor-pointer hover:border-[#384252] transition-colors">
              <div>
                <span className="text-xs font-semibold text-[#E6E8EC] block">
                  Allow Late Joiners
                </span>
                <span className="text-[11px] text-[#9AA0AD] block">
                  Allow friends to join as spectators while a round is actively underway.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowLateJoin}
                onChange={(e) => setAllowLateJoin(e.target.checked)}
                className="w-4 h-4 rounded text-[#FFB800] accent-[#FFB800] cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-md mt-3 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Creating Room...' : 'Create Room & Enter Lobby'}
          </button>
        </form>
      </div>
    </div>
  );
};
