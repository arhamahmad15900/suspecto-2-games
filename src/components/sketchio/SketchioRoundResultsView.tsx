import React from 'react';
import { Trophy, Clock, Pencil, Check } from 'lucide-react';
import { useSketchio } from '../../context/SketchioContext.js';
import { AvatarDisplay } from '../AvatarDisplay.js';

export const SketchioRoundResultsView: React.FC = () => {
  const { skRoomState, skTimeRemaining } = useSketchio();
  if (!skRoomState || !skRoomState.lastRoundResult) return null;

  const result = skRoomState.lastRoundResult;
  const sortedPlayers = [...skRoomState.players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
          <Pencil size={11} />
          Round {result.roundNumber} Results
        </div>
        <h2 className="font-display text-3xl font-black text-white">
          The word was{' '}
          <span className="text-[#22D3EE]">"{result.word}"</span>
        </h2>
        <p className="text-sm text-[#475569] mt-1 font-mono">
          {result.drawerName} was drawing
          {result.drawerPoints > 0 && ` · earned ${result.drawerPoints} pts`}
        </p>
      </div>

      {/* Correct guessers */}
      {result.correctGuessers.length > 0 ? (
        <div className="w-full glass rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#9AA0AD]">
            <Check size={14} className="text-emerald-400" />
            Guessed correctly ({result.correctGuessers.length})
          </div>
          <div className="space-y-2">
            {result.correctGuessers.map((g, i) => {
              const player = skRoomState.players.find(p => p.id === g.id);
              return (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                  <span className="font-mono text-xs text-[#475569] w-4">{i + 1}</span>
                  <AvatarDisplay avatarId={player?.avatar ?? 'detective'} size="sm" showBorder={false} />
                  <span className="flex-1 text-sm font-semibold text-[#E6E8EC]">{g.username}</span>
                  <div className="text-right">
                    <span className="font-display font-black text-sm text-emerald-400">+{g.points} pts</span>
                    <p className="text-[10px] text-[#475569] font-mono">{(g.timeMs / 1000).toFixed(1)}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full text-center py-6 mb-6 glass rounded-2xl">
          <p className="text-sm text-[#475569] font-mono">Nobody guessed the word this round!</p>
        </div>
      )}

      {/* Scoreboard */}
      <div className="w-full glass rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#9AA0AD]">
          <Trophy size={14} className="text-[#F5A623]" />
          Current Standings
        </div>
        <div className="space-y-2">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
              i === 0 ? 'bg-[#F5A623]/8 border-[#F5A623]/25' : 'bg-[#0F1217] border-[#28303F]'
            }`}>
              <span className={`font-mono text-xs w-4 font-bold ${i === 0 ? 'text-[#F5A623]' : 'text-[#475569]'}`}>
                {i === 0 ? '🥇' : i + 1}
              </span>
              <AvatarDisplay avatarId={p.avatar} size="sm" showBorder={false} />
              <span className="flex-1 text-sm font-semibold text-[#E6E8EC] truncate">{p.username}</span>
              <span className={`font-display font-black text-sm ${i === 0 ? 'text-[#F5A623]' : 'text-[#E6E8EC]'}`}>
                {p.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next round countdown */}
      <div className="flex items-center gap-2 text-sm text-[#475569] font-mono animate-pulse">
        <Clock size={13} />
        Next round in {skTimeRemaining}s…
      </div>
    </div>
  );
};
