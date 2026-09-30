import React, { useEffect, useState } from 'react';
import { Clock, Pencil } from 'lucide-react';
import { useSketchio } from '../../context/SketchioContext.js';
import { sounds } from '../../services/sound.js';
import { SKETCHIO_WORDS } from '../../utils/sketchioWords.js';

export const SketchioWordSelectView: React.FC = () => {
  const { skRoomState, skPrivateInfo, skTimeRemaining, skSelectWord, skAmIDrawer } = useSketchio();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { setSelected(null); }, [skRoomState?.currentDrawerId]);

  if (!skRoomState) return null;
  const drawer = skRoomState.players.find(p => p.id === skRoomState.currentDrawerId);

  const handlePick = (word: string) => {
    if (selected) return;
    sounds.playClick();
    setSelected(word);
    skSelectWord(word);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-12 animate-in fade-in duration-300 flex flex-col items-center">
      {/* Timer ring */}
      <div className="relative mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-display text-3xl font-black"
          style={{
            background: `conic-gradient(#22D3EE ${skTimeRemaining / 15 * 360}deg, rgba(255,255,255,0.06) 0deg)`,
            boxShadow: '0 0 32px rgba(34,211,238,0.25)',
          }}
        >
          <div className="w-14 h-14 rounded-full bg-[#0B0C0E] flex items-center justify-center text-[#22D3EE] text-2xl font-black">
            {skTimeRemaining}
          </div>
        </div>
      </div>

      {skAmIDrawer && skPrivateInfo?.wordChoices ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Pencil size={16} className="text-[#22D3EE]" />
            <h2 className="font-display text-xl font-black text-white">Pick your word</h2>
          </div>
          <p className="text-xs text-[#475569] font-mono mb-8 text-center">
            You have {skTimeRemaining}s — choose wisely. Others can't see until you draw.
          </p>

          <div className="grid grid-cols-1 gap-3 w-full">
            {skPrivateInfo.wordChoices.map((word, i) => {
              const meta = SKETCHIO_WORDS.find(w => w.word.toLowerCase() === word.toLowerCase());
              const diff = meta?.difficulty ?? 'medium';
              const diffColor = diff === 'easy' ? '#10B981' : diff === 'hard' ? '#EF4444' : '#F5A623';
              return (
              <button
                key={word}
                onClick={() => handlePick(word)}
                disabled={!!selected}
                className={`w-full py-5 px-6 rounded-2xl font-display font-black text-lg border-2 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  selected === word
                    ? 'border-[#22D3EE] bg-[#22D3EE]/15 text-[#22D3EE] scale-[1.02]'
                    : selected
                      ? 'border-[#1A1F2E] bg-[#0A0B10] text-[#2A3045] opacity-40'
                      : 'border-[#28303F] bg-[#111218] text-white hover:border-[#22D3EE]/60 hover:bg-[#22D3EE]/8 hover:-translate-y-0.5'
                }`}
                style={{ boxShadow: selected === word ? '0 0 24px rgba(34,211,238,0.2)' : undefined }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-widest mr-3 opacity-40">
                      {['A', 'B', 'C'][i]}
                    </span>
                    {word}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: diffColor }}>
                    {diff}
                  </span>
                </div>
              </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl font-black text-white mb-3 text-center">
            <span className="text-[#22D3EE]">{drawer?.username ?? 'Someone'}</span> is choosing a word…
          </h2>
          <p className="text-sm text-[#475569] font-mono text-center mb-8">
            Get ready to guess! The drawing starts soon.
          </p>

          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[#22D3EE]/20 bg-[#22D3EE]/5">
            <Clock size={14} className="text-[#22D3EE]" />
            <span className="font-mono text-sm text-[#22D3EE] font-bold">{skTimeRemaining}s remaining</span>
          </div>

          {/* Player list with scores */}
          <div className="mt-8 w-full space-y-2">
            {[...skRoomState.players].sort((a, b) => b.score - a.score).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#111218] border border-[#28303F]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-[#475569] w-4">{i + 1}</span>
                  <span className="text-sm font-semibold text-[#E6E8EC]">{p.username}</span>
                  {p.id === skRoomState.currentDrawerId && (
                    <span className="text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-1.5 py-0.5 rounded">
                      DRAWING
                    </span>
                  )}
                </div>
                <span className="font-display font-bold text-sm text-[#F5A623]">{p.score} pts</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
