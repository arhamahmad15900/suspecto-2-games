/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Award, AlertTriangle, ShieldCheck, Skull, ArrowRight, Clock, DoorOpen, MessageSquare, BarChart2 } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { VoiceControls } from './VoiceControls.js';
import { sounds } from '../services/sound.js';
import { gsap } from 'gsap';

export const VoteResultsView: React.FC = () => {
  const { roomState, leaveRoom, timeRemainingSeconds, toggleChat, unreadChatCount } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);

  const result = roomState?.lastVoteResult;
  const isImposterEliminated = result?.eliminatedPlayerRole === 'IMPOSTER';

  useEffect(() => {
    if (result && !result.isTie && result.eliminatedPlayerName) {
      sounds.playElimination();
    }

    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.results-stagger',
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [result]);

  if (!roomState || !result) return null;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div
        className={`absolute w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          isImposterEliminated
            ? 'bg-amber-500/15 top-1/4 left-1/2 -translate-x-1/2'
            : 'bg-red-600/15 top-1/4 left-1/2 -translate-x-1/2'
        }`}
      />

      <div className="w-full max-w-lg relative rounded-2xl p-6 sm:p-9 bg-[#111116]/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.7)] text-center">
        {/* Next Phase Timer, Voice, Chat & Exit */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 text-xs results-stagger">
          <span className="text-zinc-400 uppercase tracking-widest font-mono font-semibold text-[11px]">
            Tribunal Verdict
          </span>
          <div className="flex items-center gap-2">
            <VoiceControls />
            <button
              onClick={() => toggleChat()}
              aria-label="Open Room Chat"
              className="relative p-2 rounded-xl bg-black/50 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <MessageSquare size={14} className="text-amber-400" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-amber-400 text-zinc-950 text-[9px] font-black">
                  {unreadChatCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400 bg-black/60 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-inner">
              <Clock size={13} className="animate-spin-slow" />
              <span>{timeRemainingSeconds}s</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Leave active game room?')) {
                  leaveRoom();
                }
              }}
              className="p-2 text-zinc-400 hover:text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer border border-transparent hover:border-red-500/30 active:scale-95"
              title="Leave Room"
            >
              <DoorOpen size={16} />
            </button>
          </div>
        </div>

        {/* Outcome Graphic & Headline */}
        {result.isTie || !result.eliminatedPlayerName ? (
          <div className="mb-6 results-stagger">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(245,166,35,0.2)]">
              <AlertTriangle size={32} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">No Player Eliminated</h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {result.explanation}
            </p>
          </div>
        ) : (
          <div className="mb-6 results-stagger">
            <div
              className={`w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-2xl p-4 ${
                isImposterEliminated
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,166,35,0.3)]'
                  : 'bg-red-600/15 border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              }`}
            >
              {isImposterEliminated ? <ShieldCheck size={36} /> : <Skull size={36} />}
            </div>

            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">
              Player Indicted
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {result.eliminatedPlayerName}
            </h2>

            <div
              className={`inline-block px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider border mb-3 ${
                isImposterEliminated
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,166,35,0.2)]'
                  : 'bg-red-500/15 text-red-300 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
            >
              ASSIGNED ROLE: {result.eliminatedPlayerRole}
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {result.explanation}
            </p>
          </div>
        )}

        {/* Vote Counts Tally */}
        <div className="p-5 bg-black/60 rounded-xl border border-white/10 mb-6 text-left results-stagger backdrop-blur-md">
          <div className="flex items-center gap-1.5 mb-3 text-zinc-400">
            <BarChart2 size={14} className="text-amber-400" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
              Ballot Breakdown
            </span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(result.counts).map(([targetId, count]) => {
              const player = roomState.players.find((p) => p.id === targetId);
              const label = targetId === 'skip' ? 'Skipped / Abstain' : player?.username || 'Unknown';

              return (
                <div key={targetId} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-200 font-medium truncate max-w-[150px]">{label}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-black/70 rounded-full overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 shadow-[0_0_8px_rgba(245,166,35,0.5)] transition-all duration-500"
                        style={{ width: `${Math.min(100, count * 25)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-white text-xs w-5 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 flex items-center justify-center gap-2 font-mono results-stagger">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Advancing investigation phase...</span>
        </div>
      </div>
    </div>
  );
};
