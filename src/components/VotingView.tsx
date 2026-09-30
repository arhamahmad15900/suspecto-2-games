/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Vote, Clock, Eye, Check, AlertCircle, Sparkles, Image as ImageIcon, DoorOpen, MessageSquare, ShieldAlert } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { VoiceControls } from './VoiceControls.js';
import { sounds } from '../services/sound.js';
import { gsap } from 'gsap';

export const VotingView: React.FC = () => {
  const {
    roomState,
    privateInfo,
    castVote,
    leaveRoom,
    timeRemainingSeconds,
    myPlayerInfo,
    toggleChat,
    unreadChatCount,
  } = useGame();
  const { effectiveProfile } = useAuth();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.voting-stagger',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!roomState) return null;

  const hasVoted = !!myPlayerInfo?.hasVoted;
  const isEliminated = !!myPlayerInfo?.isEliminated;

  // Active eligible candidates to vote for (alive players)
  const candidates = roomState.players.filter((p) => !p.isEliminated);
  const totalEligibleVoters = candidates.length;
  const votedCount = roomState.players.filter((p) => p.hasVoted).length;

  const handleConfirmVote = (targetId: string | 'skip') => {
    if (hasVoted || isEliminated) return;
    sounds.playVoteCast();
    castVote(targetId);
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto px-4 py-8 relative">
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full blur-[140px] bg-amber-500/10 top-0 left-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header Container */}
      <div className="voting-stagger p-6 sm:p-7 bg-[#111116]/85 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert size={16} className="text-amber-400" />
              <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-amber-400 block">
                Deliberation & Tribunal
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Identify & Expose The Imposter
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg">
              Review canvas strokes and behaviors. Cast your ballot to indict the suspect who seemed unfamiliar with the secret word.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <VoiceControls />

            <button
              onClick={() => toggleChat()}
              aria-label="Open Room Chat"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/50 hover:bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <MessageSquare size={14} className="text-amber-400" />
              <span>Chat</span>
              {unreadChatCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Voting Countdown */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-sm font-bold bg-black/60 border border-amber-500/30 text-amber-400 shadow-inner">
              <Clock size={15} className="animate-spin-slow" />
              <span>{timeRemainingSeconds}s</span>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={() => {
                if (window.confirm('Leave active game room?')) {
                  leaveRoom();
                }
              }}
              className="p-2 rounded-xl bg-black/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
              title="Leave Room"
            >
              <DoorOpen size={16} />
            </button>

            {/* Voting Progress Pill */}
            <div className="text-right hidden sm:block pl-2 border-l border-white/10">
              <span className="text-[11px] font-mono text-zinc-300 block font-bold">
                {votedCount} / {totalEligibleVoters} Voted
              </span>
              <div className="w-24 h-1.5 bg-black/60 rounded-full overflow-hidden mt-1 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-300 shadow-[0_0_8px_rgba(245,166,35,0.6)]"
                  style={{
                    width: `${totalEligibleVoters > 0 ? (votedCount / totalEligibleVoters) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Reminder / Status Banner */}
      {isEliminated ? (
        <div className="voting-stagger mb-6 p-4 bg-black/50 border border-white/10 rounded-xl text-xs text-zinc-400 text-center font-mono backdrop-blur-md">
          You are currently eliminated and spectating tribunal deliberations.
        </div>
      ) : hasVoted ? (
        <div className="voting-stagger mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-center gap-2 backdrop-blur-md font-mono shadow-[0_0_20px_rgba(245,166,35,0.1)]">
          <Check size={16} className="text-amber-400" />
          <span>Ballot registered securely. Waiting for remaining suspect deliberations...</span>
        </div>
      ) : null}

      {/* Player Candidate Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {candidates.map((player) => {
          const isSelf = player.id === effectiveProfile.id;
          const isSelected = selectedTarget === player.id;

          return (
            <div
              key={player.id}
              className={`voting-stagger p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl ${
                isSelected
                  ? 'bg-[#181820]/90 border-amber-400 shadow-[0_0_25px_rgba(245,166,35,0.25)] scale-[1.02]'
                  : 'bg-[#111116]/80 border-white/10 hover:border-white/20 hover:bg-[#16161d]'
              }`}
            >
              <div className="mb-4 relative">
                <AvatarDisplay avatarId={player.avatar} size="lg" />
                {player.hasVoted && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-zinc-950 shadow-md">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <span className="font-display font-bold text-base text-white max-w-[160px] truncate mb-1">
                {player.username}
              </span>

              <span className="text-[11px] font-mono text-zinc-400 mb-5">
                {player.hasVoted ? '✓ Ballot Submitted' : '⏳ Deliberating...'}
              </span>

              {isSelf ? (
                <div className="w-full py-2.5 bg-black/40 rounded-xl text-zinc-500 text-xs font-mono font-medium border border-white/5">
                  Cannot accuse self
                </div>
              ) : hasVoted ? (
                <div className="w-full py-2.5 bg-black/40 rounded-xl text-zinc-500 text-xs font-mono font-medium border border-white/5">
                  Voted
                </div>
              ) : (
                <button
                  onClick={() => handleConfirmVote(player.id)}
                  disabled={hasVoted || isEliminated}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-900/30 hover:shadow-[0_0_18px_rgba(239,68,68,0.4)] active:scale-95 disabled:opacity-40"
                >
                  <Vote size={14} />
                  <span>Accuse & Eliminate</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip / Abstain Vote */}
      {!hasVoted && !isEliminated && (
        <div className="text-center voting-stagger">
          <button
            onClick={() => handleConfirmVote('skip')}
            className="py-3 px-6 bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-xs font-mono font-semibold rounded-xl transition-all duration-200 cursor-pointer active:scale-95 shadow-md"
          >
            Abstain / Skip Indictment
          </button>
        </div>
      )}
    </div>
  );
};
