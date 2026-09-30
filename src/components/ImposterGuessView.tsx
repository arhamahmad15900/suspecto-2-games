/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, Clock, Send, Sparkles, AlertCircle, DoorOpen, MessageSquare, KeyRound, Skull } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { VoiceControls } from './VoiceControls.js';
import { sounds } from '../services/sound.js';

export const ImposterGuessView: React.FC = () => {
  const { roomState, privateInfo, submitImposterGuess, leaveRoom, timeRemainingSeconds, toggleChat, unreadChatCount } = useGame();
  const [guess, setGuess] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!roomState) return null;

  const isImposter = privateInfo?.role === 'IMPOSTER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isSubmitted) return;
    sounds.playClick();
    setIsSubmitted(true);
    submitImposterGuess(guess.trim());
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background glow */}
      <div
        className={`absolute w-96 h-96 rounded-full blur-[140px] pointer-events-none ${
          isImposter ? 'bg-red-600/18 top-1/4 left-1/2 -translate-x-1/2' : 'bg-amber-500/15 top-1/4 left-1/2 -translate-x-1/2'
        }`}
      />

      <div className="w-full max-w-lg relative rounded-2xl p-6 sm:p-9 bg-[#111116]/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center">
        {/* Header, Voice, Chat & Exit */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
            <KeyRound size={14} />
            <span>High Stakes Gamble</span>
          </div>
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

        <div
          className={`w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-2xl p-4 ${
            isImposter
              ? 'bg-red-600/15 border-red-500/40 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_30px_rgba(245,166,35,0.3)]'
          }`}
        >
          {isImposter ? <Skull size={36} /> : <HelpCircle size={36} />}
        </div>

        {isImposter ? (
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Final Counter-Gamble
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto mb-6">
              You were exposed by the crew! However, if you deduce and type the <strong className="text-amber-400">exact secret word</strong>, victory is instantly stolen back for the Imposter.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="TYPE SECRET WORD HERE..."
                  disabled={isSubmitted}
                  autoFocus
                  className="w-full py-3.5 px-4 bg-black/70 border-2 border-red-500/40 focus:border-red-400 rounded-xl text-center font-display font-black text-lg text-amber-300 placeholder:text-zinc-600 focus:outline-none transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitted || !guess.trim()}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-900/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
              >
                <Send size={16} />
                <span>{isSubmitted ? 'Transmitting Guess...' : 'Submit Counter-Guess'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Imposter Interception In Progress
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto mb-6">
              The uncovered suspect is attempting their last-ditch counter-guess. If they name the secret word, they steal the match.
            </p>
            <div className="p-4 bg-black/60 rounded-xl border border-white/10 flex items-center justify-center gap-2.5 text-xs text-amber-400 font-mono shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Awaiting suspect transmission...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
