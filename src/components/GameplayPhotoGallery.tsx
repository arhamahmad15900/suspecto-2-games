/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GameplayPhaseCards — Visual breakdown of the three core game phases.
 * Clean icon-based cards, no AI-generated images.
 */

import React, { useState } from 'react';
import { Palette, ShieldCheck, Trophy, X, ChevronRight } from 'lucide-react';
import { sounds } from '../services/sound.js';

interface Phase {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  description: string;
  highlights: string[];
  visual: React.ReactNode;
}

const DrawingVisual = () => (
  <svg viewBox="0 0 240 140" className="w-full h-full" aria-hidden="true">
    <rect width="240" height="140" fill="#0A0B10" rx="8" />
    {/* Grid lines */}
    <line x1="0" y1="35" x2="240" y2="35" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="0" y1="70" x2="240" y2="70" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="0" y1="105" x2="240" y2="105" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="60" y1="0" x2="60" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="120" y1="0" x2="120" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="180" y1="0" x2="180" y2="140" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    {/* Stylized drawing strokes */}
    <path d="M 30 100 Q 60 40 90 70 Q 110 90 130 50 Q 150 20 180 60 Q 200 85 210 70" fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    <path d="M 50 110 Q 80 80 110 95 Q 140 110 170 85" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <path d="M 80 120 L 160 120" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    {/* Brush cursor */}
    <circle cx="210" cy="70" r="4" fill="#22D3EE" opacity="0.9" />
    <circle cx="210" cy="70" r="8" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.4" />
    {/* Color palette dots */}
    <circle cx="20" cy="20" r="5" fill="#F5A623" />
    <circle cx="34" cy="20" r="5" fill="#22D3EE" />
    <circle cx="48" cy="20" r="5" fill="#A78BFA" />
    <circle cx="62" cy="20" r="5" fill="#F472B6" />
    {/* Player stroke indicators */}
    <rect x="190" y="10" width="40" height="6" rx="3" fill="rgba(34,211,238,0.15)" />
    <rect x="190" y="10" width="28" height="6" rx="3" fill="rgba(34,211,238,0.5)" />
  </svg>
);

const VotingVisual = () => (
  <svg viewBox="0 0 240 140" className="w-full h-full" aria-hidden="true">
    <rect width="240" height="140" fill="#0A0B10" rx="8" />
    {/* Suspect cards */}
    {[
      { x: 15, name: 'Nova', color: '#F5A623', votes: 1 },
      { x: 75, name: 'Echo', color: '#A78BFA', votes: 3 },
      { x: 135, name: 'Rook', color: '#22D3EE', votes: 1 },
      { x: 195, name: 'Hex',  color: '#F472B6', votes: 0 },
    ].map((s) => (
      <g key={s.name}>
        <rect x={s.x} y="20" width="40" height="50" rx="6" fill={`${s.color}18`} stroke={`${s.color}40`} strokeWidth="1" />
        <circle cx={s.x + 20} cy="38" r="10" fill={`${s.color}30`} stroke={s.color} strokeWidth="1.5" />
        <text x={s.x + 20} y="43" textAnchor="middle" fill={s.color} fontSize="10" fontFamily="monospace">{s.name[0]}</text>
        <text x={s.x + 20} y="62" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">{s.name}</text>
        {/* Vote dots */}
        {Array.from({ length: s.votes }).map((_, i) => (
          <circle key={i} cx={s.x + 8 + i * 10} cy="82" r="4" fill={s.color} opacity="0.8" />
        ))}
      </g>
    ))}
    {/* "Most votes" indicator */}
    <rect x="75" y="15" width="40" height="60" rx="6" fill="rgba(239,68,68,0.06)" stroke="rgba(239,68,68,0.35)" strokeWidth="1.5" />
    <text x="95" y="102" textAnchor="middle" fill="#EF4444" fontSize="7" fontFamily="monospace">SUSPECT</text>
    {/* Timer arc */}
    <circle cx="200" cy="110" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
    <circle cx="200" cy="110" r="16" fill="none" stroke="#F5A623" strokeWidth="3" strokeLinecap="round"
      strokeDasharray="62" strokeDashoffset="20" transform="rotate(-90 200 110)" />
    <text x="200" y="114" textAnchor="middle" fill="#F5A623" fontSize="9" fontFamily="monospace">15s</text>
  </svg>
);

const VictoryVisual = () => (
  <svg viewBox="0 0 240 140" className="w-full h-full" aria-hidden="true">
    <rect width="240" height="140" fill="#0A0B10" rx="8" />
    {/* Revealed identity card */}
    <rect x="70" y="15" width="100" height="70" rx="8" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" />
    <circle cx="120" cy="40" r="14" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="1.5" />
    <text x="120" y="45" textAnchor="middle" fill="#EF4444" fontSize="14">★</text>
    <text x="120" y="62" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace">IMPOSTER</text>
    <text x="120" y="74" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">IDENTIFIED</text>
    {/* XP bar */}
    <text x="20" y="102" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">XP GAINED</text>
    <rect x="20" y="106" width="120" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
    <rect x="20" y="106" width="88" height="6" rx="3" fill="#F5A623" opacity="0.8" />
    {/* Rank badge */}
    <rect x="160" y="95" width="60" height="28" rx="6" fill="rgba(245,166,35,0.1)" stroke="rgba(245,166,35,0.3)" strokeWidth="1" />
    <text x="190" y="106" textAnchor="middle" fill="#F5A623" fontSize="7" fontFamily="monospace">RANK UP</text>
    <text x="190" y="116" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="monospace">Detective II</text>
    {/* Confetti particles */}
    {[
      [30, 30, '#F5A623'], [50, 20, '#A78BFA'], [200, 25, '#22D3EE'],
      [220, 40, '#F472B6'], [15, 50, '#F5A623'], [230, 60, '#A78BFA'],
    ].map(([cx, cy, fill], i) => (
      <circle key={i} cx={cx as number} cy={cy as number} r="3" fill={fill as string} opacity="0.7" />
    ))}
  </svg>
);

const PHASES: Phase[] = [
  {
    id: 'drawing',
    step: '01',
    title: 'Blind Sketch Phase',
    subtitle: 'Stroke by stroke, subtle clues take shape on the shared canvas.',
    tag: 'PHASE 01 — DRAWING',
    icon: <Palette size={18} />,
    accentColor: '#22D3EE',
    borderColor: 'rgba(34,211,238,0.3)',
    bgColor: 'rgba(34,211,238,0.06)',
    textColor: 'text-cyan-400',
    description:
      'Each player adds one stroke to a shared canvas. Crew members subtly hint at the secret word — the Imposter must improvise without ever seeing it.',
    highlights: ['Real-time synchronized canvas', 'Variable brush sizes & colors', 'Live voice and text chat'],
    visual: <DrawingVisual />,
  },
  {
    id: 'voting',
    title: 'Tribunal Vote',
    step: '02',
    subtitle: 'Voice chat ignites as suspects defend their strokes.',
    tag: 'PHASE 02 — TRIBUNAL',
    icon: <ShieldCheck size={18} />,
    accentColor: '#F5A623',
    borderColor: 'rgba(245,166,35,0.3)',
    bgColor: 'rgba(245,166,35,0.06)',
    textColor: 'text-amber-400',
    description:
      'When drawing ends, interrogate suspicious lines and cast your vote. The player with the most votes is exposed — was it the Imposter?',
    highlights: ['Interactive voting cards', 'Live audio waveforms', 'Instant tally breakdown'],
    visual: <VotingVisual />,
  },
  {
    id: 'reveal',
    step: '03',
    title: 'Reveal & Results',
    subtitle: 'Truth uncovered — or the Imposter steals the win.',
    tag: 'PHASE 03 — RESOLUTION',
    icon: <Trophy size={18} />,
    accentColor: '#EF4444',
    borderColor: 'rgba(239,68,68,0.3)',
    bgColor: 'rgba(239,68,68,0.06)',
    textColor: 'text-red-400',
    description:
      'The Imposter is revealed. If eliminated, they get one dramatic last-ditch guess to name the secret word and steal the game from the crew.',
    highlights: ['Full match canvas replay', 'XP & rank progression', 'Match history archive'],
    visual: <VictoryVisual />,
  },
];

interface DetailModalProps {
  phase: Phase;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ phase, onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
    style={{ animation: 'fadeInModal 0.18s ease both' }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg rounded-2xl bg-[#111218] border overflow-hidden shadow-2xl"
      style={{ borderColor: phase.borderColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: phase.bgColor, border: `1px solid ${phase.borderColor}`, color: phase.accentColor }}
          >
            {phase.icon}
          </div>
          <div>
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider block"
              style={{ color: phase.accentColor }}
            >
              {phase.tag}
            </span>
            <h3 className="font-display text-base font-bold text-white">{phase.title}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <X size={17} />
        </button>
      </div>

      {/* Visual */}
      <div className="aspect-video w-full bg-[#0A0B10]">{phase.visual}</div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <p className="text-sm text-zinc-300 leading-relaxed">{phase.description}</p>
        <div className="rounded-xl bg-black/40 border border-white/8 p-4">
          <span
            className="text-[10px] font-mono uppercase font-bold tracking-wider block mb-3"
            style={{ color: phase.accentColor }}
          >
            Key Details
          </span>
          <div className="space-y-2">
            {phase.highlights.map((hl, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: phase.accentColor }} />
                {hl}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const GameplayPhotoGallery: React.FC = () => {
  const [selected, setSelected] = useState<Phase | null>(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {PHASES.map((phase) => (
          <div
            key={phase.id}
            onClick={() => { sounds.playClick(); setSelected(phase); }}
            className="group relative rounded-2xl overflow-hidden bg-[#0E0F15] border transition-all duration-300 cursor-pointer hover:-translate-y-1 flex flex-col"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = phase.borderColor; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            {/* Visual area */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#0A0B10]">
              {phase.visual}
              {/* Step badge */}
              <div
                className="absolute top-3 left-3 px-2.5 py-1 rounded-md border backdrop-blur-md flex items-center gap-1.5 text-[10px] font-mono font-bold"
                style={{ background: 'rgba(0,0,0,0.6)', borderColor: phase.borderColor, color: phase.accentColor }}
              >
                {phase.icon}
                <span>{phase.tag}</span>
              </div>
              {/* Expand hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/35 backdrop-blur-[2px]">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                  style={{ background: phase.accentColor, color: '#08090E' }}
                >
                  View details <ChevronRight size={13} />
                </div>
              </div>
            </div>

            {/* Card content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: phase.accentColor }}
                  >
                    STEP {phase.step}
                  </span>
                </div>
                <h4 className="font-display font-bold text-base text-white group-hover:transition-colors mb-1"
                  style={{ color: undefined }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLHeadingElement).style.color = phase.accentColor; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLHeadingElement).style.color = ''; }}
                >
                  {phase.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{phase.subtitle}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                <span>{phase.highlights[0]}</span>
                <span style={{ color: phase.accentColor }}>Details →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <DetailModal phase={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
