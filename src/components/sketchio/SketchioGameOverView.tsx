import React from 'react';
import { Trophy, RotateCcw, Home, Pencil, Star } from 'lucide-react';
import { useSketchio } from '../../context/SketchioContext.js';
import { AvatarDisplay } from '../AvatarDisplay.js';
import { sounds } from '../../services/sound.js';

interface Props {
  onGoHome: () => void;
}

export const SketchioGameOverView: React.FC<Props> = ({ onGoHome }) => {
  const { skRoomState, skAmIHost, skRestartGame, skLeave } = useSketchio();
  if (!skRoomState) return null;

  const sorted = [...skRoomState.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const medals = ['🥇', '🥈', '🥉'];

  const handleRestart = () => { sounds.playClick(); skRestartGame(); };
  const handleLeave   = () => { skLeave(); onGoHome(); };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-10 animate-in fade-in duration-300 flex flex-col items-center">
      {/* Winner banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/25 text-[#F5A623] font-mono text-[11px] font-bold uppercase tracking-wider mb-4">
          <Trophy size={11} />
          Game Over
        </div>
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-white mb-1">
          <span className="text-[#F5A623]">{winner?.username}</span> wins!
        </h2>
        <p className="text-sm text-[#475569] font-mono">with {winner?.score} points</p>
      </div>

      {/* Podium */}
      <div className="w-full glass rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#9AA0AD]">
          <Star size={14} className="text-[#F5A623]" />
          Final Leaderboard
        </div>
        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                i === 0
                  ? 'bg-[#F5A623]/10 border-[#F5A623]/35 shadow-[0_0_20px_rgba(245,166,35,0.12)]'
                  : i === 1
                    ? 'bg-[#94A3B8]/6 border-[#94A3B8]/20'
                    : i === 2
                      ? 'bg-[#CD7F32]/6 border-[#CD7F32]/20'
                      : 'bg-[#0F1217] border-[#28303F]'
              }`}
            >
              <span className="text-xl w-8 text-center">{medals[i] ?? i + 1}</span>
              <AvatarDisplay avatarId={p.avatar} size="md" showBorder={false} />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-[#E6E8EC] truncate">{p.username}</p>
                {i === 0 && <p className="text-[10px] text-[#F5A623] font-mono">Champion</p>}
              </div>
              <div className="text-right">
                <span className={`font-display font-black text-lg ${i === 0 ? 'text-[#F5A623]' : 'text-[#E6E8EC]'}`}>
                  {p.score}
                </span>
                <p className="text-[10px] text-[#475569] font-mono">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {skAmIHost && (
          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-display font-black text-sm text-[#08090E] bg-gradient-to-r from-[#22D3EE] to-[#38BDF8] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-cyan-900/25 active:scale-[0.98]"
          >
            <RotateCcw size={15} />
            Play Again
          </button>
        )}
        <button
          onClick={handleLeave}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-display font-bold text-sm text-[#9AA0AD] hover:text-white bg-[#111218] border border-[#28303F] hover:border-white/15 transition-all cursor-pointer"
        >
          <Home size={15} />
          Back to Games
        </button>
      </div>

      {!skAmIHost && (
        <p className="text-xs text-[#2A3045] font-mono mt-4">Waiting for host to restart…</p>
      )}
    </div>
  );
};
