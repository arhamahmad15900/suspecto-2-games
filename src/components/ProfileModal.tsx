import React, { useState } from 'react';
import { X, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { AVATAR_LIST } from '../utils/avatars.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { Logo } from './Logo.js';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, effectiveProfile, updateProfile, logout } = useAuth();
  const [username, setUsername] = useState(effectiveProfile.username);
  const [avatar, setAvatar] = useState(effectiveProfile.avatar);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    try {
      await updateProfile({ username: username.trim(), avatar });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const stats = user?.stats || {
    gamesPlayed: 0,
    crewWins: 0,
    imposterWins: 0,
    timesImposter: 0,
    timesEliminated: 0,
  };

  const totalWins = stats.crewWins + stats.imposterWins;
  const winRate = stats.gamesPlayed > 0 ? Math.round((totalWins / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="sm" />
          </div>
          <div className="relative inline-block mb-3">
            <AvatarDisplay avatarId={avatar} size="xl" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">{effectiveProfile.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-1 text-xs text-[#9AA0AD]">
            {user ? (
              <span className="text-[#FFB800] font-medium">{user.email}</span>
            ) : (
              <span>Guest Player</span>
            )}
            <span>·</span>
            <span>Joined {user ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#0F1217] rounded-xl border border-[#28303F] mb-6">
          <div className="text-center">
            <span className="block text-lg font-bold font-mono text-[#E6E8EC]">{stats.gamesPlayed}</span>
            <span className="text-[11px] text-[#9AA0AD]">Matches</span>
          </div>
          <div className="text-center border-x border-[#28303F]">
            <span className="block text-lg font-bold font-mono text-[#E6E8EC]">{totalWins}</span>
            <span className="text-[11px] text-[#9AA0AD]">Total Wins</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold font-mono text-[#FFB800]">{winRate}%</span>
            <span className="text-[11px] text-[#9AA0AD]">Win Rate</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {user && (
          <div className="grid grid-cols-2 gap-2 text-xs mb-6 text-[#E6E8EC]">
            <div className="p-2.5 bg-[#0F1217] rounded-lg border border-[#28303F] flex items-center justify-between">
              <span className="text-[#9AA0AD]">Crew Wins:</span>
              <span className="font-mono font-bold text-[#E6E8EC]">{stats.crewWins}</span>
            </div>
            <div className="p-2.5 bg-[#0F1217] rounded-lg border border-[#28303F] flex items-center justify-between">
              <span className="text-[#9AA0AD]">Imposter Wins:</span>
              <span className="font-mono font-bold text-[#FFB800]">{stats.imposterWins}</span>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#9AA0AD] mb-1.5">Avatar Selection</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_LIST.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatar(av.id)}
                  className={`p-2 flex flex-col items-center gap-1 rounded-xl transition-all cursor-pointer border ${
                    avatar === av.id
                      ? 'bg-[#202632] border-[#FFB800] ring-1 ring-[#FFB800]/50'
                      : 'bg-[#0F1217] border-[#28303F] hover:border-[#384252]'
                  }`}
                >
                  <AvatarDisplay avatarId={av.id} size="sm" showBorder={false} />
                  <span className="text-[10px] text-[#9AA0AD] font-medium">{av.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9AA0AD] mb-1">
              Display Name / Nickname
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
            />
          </div>

          {error && <p className="text-xs text-[#E63946]">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC425] text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
            >
              {isSaved ? <Check size={16} /> : null}
              <span>{isSaved ? 'Saved!' : 'Update Profile'}</span>
            </button>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-3 bg-[#202632] hover:bg-[#28303F] text-[#E63946] rounded-xl transition-colors cursor-pointer border border-[#28303F]"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="py-2.5 px-3 bg-[#202632] hover:bg-[#28303F] text-[#FFB800] font-semibold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap border border-[#28303F]"
              >
                Sign In
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
