/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, LogIn, Menu, X, HelpCircle, BookOpen, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useGame } from '../context/GameContext.js';
import { useSketchio } from '../context/SketchioContext.js';
import { sounds } from '../services/sound.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { Logo } from './Logo.js';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenRegister?: () => void;
  onOpenProfile: () => void;
  onOpenHowToPlay: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  /** Navigate back to the main landing page from anywhere */
  onGoHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth, onOpenRegister, onOpenProfile, onOpenHowToPlay, onOpenRules, onOpenHistory, onGoHome,
}) => {
  const { user, effectiveProfile } = useAuth();
  const { roomState, leaveRoom } = useGame();
  const { skRoomState, skLeave } = useSketchio();
  const activeRoomCode = roomState?.roomCode ?? skRoomState?.roomCode;
  const inMatch = Boolean(roomState || skRoomState);

  const confirmLeaveMatch = () => {
    if (!window.confirm('Leave current room?')) return;
    if (roomState) leaveRoom();
    if (skRoomState) skLeave();
  };
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleToggleSound = () => {
    const m = sounds.toggleMute();
    setIsMuted(m);
    if (!m) sounds.playClick();
  };

  const navLinks = [
    { label: 'How to Play',   icon: <HelpCircle size={16} />, action: onOpenHowToPlay },
    { label: 'Rules',         icon: <BookOpen size={16} />,   action: onOpenRules },
    { label: 'Match History', icon: <Trophy size={16} />,     action: onOpenHistory },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: scrolled ? 'rgba(4,5,10,0.92)' : 'rgba(4,5,10,0.65)',
        backdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'blur(16px) saturate(130%)',
        WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'blur(16px) saturate(130%)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.04)',
        boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.45)' : 'none',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        {/* Zone 1: Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (inMatch) {
                if (window.confirm('Return to home? You will leave your active room.')) {
                  if (roomState) leaveRoom();
                  if (skRoomState) skLeave();
                  onGoHome?.();
                }
              } else if (onGoHome) {
                onGoHome();
              }
            }}
            className="flex items-center text-left cursor-pointer focus-visible:outline-none"
            title="Home"
          >
            <Logo size="sm" />
          </button>

          {!inMatch ? (
            <span className="hidden lg:inline text-[11px] text-[#2A3045] font-medium border-l border-[rgba(255,255,255,0.06)] pl-3">
              by{' '}
              <span className="text-[#475569] hover:text-[#F5A623] transition-colors duration-300 cursor-default">
                Arham Ahmad Khan
              </span>
            </span>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[rgba(255,255,255,0.06)] text-xs text-[#94A3B8]">
              <span>Room</span>
              <span className="badge badge-gold">{activeRoomCode}</span>
            </div>
          )}
        </div>

        {/* Zone 2: Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]">
          {navLinks.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="relative py-1 hover:text-[#F8FAFC] transition-colors duration-300 cursor-pointer group"
            >
              {item.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#F5A623] group-hover:w-full transition-all duration-350 ease-out" />
            </button>
          ))}
          {inMatch && (
            <button
              onClick={confirmLeaveMatch}
              className="text-[#EF4444] hover:text-[#FF6B7A] transition-colors cursor-pointer font-semibold"
            >
              Exit Match
            </button>
          )}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl glass text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-all duration-300 cursor-pointer hover:border-[rgba(255,255,255,0.12)]"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {user ? (
            <button
              onClick={onOpenProfile}
              className="min-h-[44px] flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl glass hover:border-[rgba(255,255,255,0.14)] transition-all duration-300 cursor-pointer group"
            >
              <AvatarDisplay avatarId={user.avatar} size="sm" showBorder={false} />
              <div className="flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-[#F8FAFC] max-w-[85px] sm:max-w-[110px] truncate group-hover:text-[#F5A623] transition-colors duration-300">
                  {user.username}
                </span>
                <span className="text-[10px] text-[#F5A623] font-mono">
                  {user.stats.crewWins + user.stats.imposterWins} Wins
                </span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenProfile}
                className="hidden sm:flex min-h-[44px] items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl glass hover:border-[rgba(255,255,255,0.12)] transition-all duration-300 text-xs text-[#94A3B8] cursor-pointer"
              >
                <AvatarDisplay avatarId={effectiveProfile.avatar} size="sm" showBorder={false} />
                <span className="max-w-[70px] truncate font-medium text-[#F8FAFC]">{effectiveProfile.username}</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10"
              >
                Sign In
              </button>
              {onOpenRegister && (
                <button
                  onClick={onOpenRegister}
                  className="btn-gold min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 text-xs shadow-md"
                >
                  <LogIn size={13} />
                  <span>Register</span>
                </button>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-xl glass text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#07090F]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {inMatch && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
              <span className="text-xs text-zinc-400">Active Game Room</span>
              <span className="badge badge-gold">{activeRoomCode}</span>
            </div>
          )}

          {navLinks.map(item => (
            <button
              key={item.label}
              onClick={() => {
                setMobileMenuOpen(false);
                item.action();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <span className="text-[#F5A623]">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenProfile();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors text-left cursor-pointer min-h-[44px]"
          >
            <AvatarDisplay avatarId={effectiveProfile.avatar} size="xs" showBorder={false} />
            <span>Profile & Statistics</span>
          </button>

          {inMatch && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                confirmLeaveMatch();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <LogOut size={16} />
              <span>Exit Current Match</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
