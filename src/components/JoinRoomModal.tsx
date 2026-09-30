import React, { useState } from 'react';
import { X, LogIn, Hash, AlertCircle } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from './Logo.js';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onRequireAuth?: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  onRequireAuth,
}) => {
  const { user } = useAuth();
  const { joinRoom } = useGame();
  const [roomCode, setRoomCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          <h2 className="font-display text-xl font-bold text-[#E6E8EC] mb-2">Account Required to Join</h2>
          <p className="text-xs text-[#9AA0AD] mb-6 leading-relaxed">
            You must be logged in to join Suspecto multiplayer game rooms. Sign in or register to join your friends!
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = roomCode.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a valid Room ID or Code.');
      return;
    }

    try {
      setIsLoading(true);
      await joinRoom(clean);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not join room.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/25 text-[#FFB800] flex items-center justify-center mx-auto mb-3">
            <Hash size={24} />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">Join Game Room</h2>
          <p className="text-xs text-[#9AA0AD] mt-1">
            Enter the 5-letter Room Code or full Room ID provided by the host.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#E63946]/10 border border-[#E63946]/30 flex items-start gap-2.5 text-xs text-[#E63946]">
            <AlertCircle size={16} className="shrink-0 text-[#E63946] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9AA0AD] mb-1.5 text-center">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. K9P2X"
              maxLength={20}
              autoFocus
              className="w-full py-3 px-4 bg-[#0F1217] border border-[#28303F] rounded-xl text-center font-mono font-bold text-lg tracking-widest text-[#FFB800] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] uppercase transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !roomCode.trim()}
            className="w-full py-3 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            <span>{isLoading ? 'Connecting to Room...' : 'Enter Game Room'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
