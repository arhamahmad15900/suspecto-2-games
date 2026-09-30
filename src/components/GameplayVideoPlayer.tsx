/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GameplayVideoPlayer — An interactive, cinematic in-game demo video player
 * showcasing active drawing, voice deliberation, and suspect elimination.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Sparkles, Radio, MessageSquare, ShieldAlert, Award } from 'lucide-react';
import { sounds } from '../services/sound.js';

interface Chapter {
  id: number;
  title: string;
  timestamp: number; // in seconds
  tag: string;
}

const CHAPTERS: Chapter[] = [
  { id: 1, title: 'Confidential Briefing', timestamp: 0, tag: 'ROLE ASSIGN' },
  { id: 2, title: 'Blind Neon Sketch', timestamp: 12, tag: 'DRAWING PHASE' },
  { id: 3, title: 'Tribunal Deliberation', timestamp: 28, tag: 'VOTING' },
  { id: 4, title: 'Imposter Unmasked', timestamp: 44, tag: 'CLIMAX REVEAL' },
];

const TOTAL_DURATION = 60; // 60 seconds loop

export const GameplayVideoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(14); // start in drawing phase
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const currentTimeRef = useRef(14);

  // Keep ref in sync
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Stroke points for drawing animation
  const strokesRef = useRef<Array<{ x: number; y: number; color: string; size: number }>>([]);

  // Time ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25;
        const val = next >= TOTAL_DURATION ? 0 : next;
        currentTimeRef.current = val;
        return val;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Procedural canvas drawing animation representing live gameplay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.fillStyle = '#08090E';
      ctx.fillRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Drawing Phase: Animate a spaceship / mystery clue being drawn
      const cur = currentTimeRef.current;
      if (cur >= 10 && cur < 28) {
        const progress = (cur - 10) / 18;
        const totalPoints = 120;
        const pointsToDraw = Math.floor(progress * totalPoints);

        ctx.shadowBlur = 12;
        ctx.shadowColor = '#F5A623';
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const cx = width * 0.5;
        const cy = height * 0.48;
        const scale = Math.min(width, height) * 0.28;

        for (let i = 0; i <= pointsToDraw; i++) {
          const t = (i / totalPoints) * Math.PI * 2;
          // Hull outline
          const x = cx + Math.sin(t) * scale * (1 + 0.3 * Math.cos(t * 2));
          const y = cy + Math.cos(t) * scale * 0.6;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Rocket fin lines
        if (pointsToDraw > 40) {
          ctx.beginPath();
          ctx.strokeStyle = '#06B6D4';
          ctx.shadowColor = '#06B6D4';
          ctx.moveTo(cx - scale * 0.9, cy + scale * 0.4);
          ctx.lineTo(cx, cy - scale * 0.8);
          ctx.lineTo(cx + scale * 0.9, cy + scale * 0.4);
          ctx.stroke();
        }

        // Active drawing pen tip with spark
        if (pointsToDraw < totalPoints) {
          const t = (pointsToDraw / totalPoints) * Math.PI * 2;
          const px = cx + Math.sin(t) * scale * (1 + 0.3 * Math.cos(t * 2));
          const py = cy + Math.cos(t) * scale * 0.6;

          ctx.shadowBlur = 18;
          ctx.shadowColor = '#FFC425';
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const jumpToChapter = (timestamp: number) => {
    setCurrentTime(timestamp);
    if (!isPlaying) setIsPlaying(true);
    if (!isMuted) sounds.playClick();
  };

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (!next) sounds.playTurnStart();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Determine current chapter
  const activeChapter =
    CHAPTERS.slice().reverse().find((c) => currentTime >= c.timestamp) || CHAPTERS[0];

  return (
    <div
      ref={containerRef}
      className="w-full relative rounded-2xl overflow-hidden border border-amber-500/30 bg-[#08090E] shadow-[0_0_50px_rgba(0,0,0,0.85)] group select-none"
    >
      {/* Top Video Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between z-20 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white font-mono text-[10px] font-black uppercase tracking-wider animate-pulse">
            <Radio size={12} />
            <span>LIVE DEMO</span>
          </div>
          <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide drop-shadow-md">
            Suspecto Match Simulation #7802
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-amber-400 px-2.5 py-0.5 rounded-md bg-black/60 border border-amber-500/30 backdrop-blur-sm">
            {activeChapter.tag}
          </span>
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline-block px-2 py-0.5 rounded bg-black/50 border border-white/10">
            1080p 60FPS
          </span>
        </div>
      </div>

      {/* Main Video Screen Area */}
      <div className="relative aspect-video w-full flex items-center justify-center overflow-hidden">
        {/* Dynamic Canvas Simulation */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Phase 01: Confidential Dossier Overlay */}
        {currentTime < 10 && (
          <div className="relative z-10 p-6 max-w-sm sm:max-w-md text-center rounded-2xl bg-black/80 border border-amber-500/40 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="inline-block px-3 py-1 rounded border border-red-500 text-red-500 font-mono text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              CLASSIFIED DOSSIER
            </div>
            <h3 className="font-display text-2xl font-black text-amber-400 mb-2">
              YOU ARE THE IMPOSTER
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Secret word is hidden from you. Observe the crew strokes, sketch plausibly, and avoid suspicion.
            </p>
          </div>
        )}

        {/* Phase 02: Active Drawing Overlay Elements */}
        {currentTime >= 10 && currentTime < 28 && (
          <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
            <div className="flex items-center justify-between text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-2 text-zinc-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>PixelPainter is drawing...</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-black/70 border border-amber-500/30 text-amber-400 font-mono font-bold backdrop-blur-md">
                Clue: "Short Hair, Spaceship"
              </div>
            </div>

            {/* Chat ticker on bottom left */}
            <div className="max-w-xs space-y-1.5 text-[11px] font-mono">
              <div className="px-2.5 py-1 rounded bg-black/70 border border-white/10 text-zinc-300 backdrop-blur-sm animate-in slide-in-from-left duration-200">
                <span className="text-amber-400 font-bold">DetectiveDora:</span> Is it flying?
              </div>
              <div className="px-2.5 py-1 rounded bg-black/70 border border-white/10 text-zinc-300 backdrop-blur-sm animate-in slide-in-from-left duration-300 delay-100">
                <span className="text-cyan-400 font-bold">SilentSam:</span> Suspect #3 hesitated!
              </div>
            </div>
          </div>
        )}

        {/* Phase 03: Voting & Tribunal Overlay */}
        {currentTime >= 28 && currentTime < 44 && (
          <div className="relative z-10 p-6 max-w-lg w-full rounded-2xl bg-black/85 border border-white/15 backdrop-blur-xl shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
              <ShieldAlert size={20} />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                Tribunal Deliberation Active
              </span>
            </div>
            <h3 className="font-display text-2xl font-black text-white mb-4">
              Indict The Suspect
            </h3>
            <div className="grid grid-cols-3 gap-2 text-left mb-3">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <span className="block font-bold text-white truncate">Player 1 (Painter)</span>
                <span className="text-[10px] text-zinc-400 font-mono">0 Votes</span>
              </div>
              <div className="p-2.5 rounded-lg bg-red-600/20 border border-red-500/40 text-xs shadow-inner">
                <span className="block font-bold text-red-400 truncate">Player 2 (Suspect)</span>
                <span className="text-[10px] text-red-300 font-mono font-bold">4 Votes (Indicted)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                <span className="block font-bold text-white truncate">Player 3 (Detective)</span>
                <span className="text-[10px] text-zinc-400 font-mono">1 Vote</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">Ballots closed. Preparing final revelation...</p>
          </div>
        )}

        {/* Phase 04: Climax & Imposter Unmasked Overlay */}
        {currentTime >= 44 && (
          <div className="relative z-10 p-6 max-w-md text-center rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(245,166,35,0.4)]">
              <Award size={28} />
            </div>
            <h3 className="font-display text-2xl font-black text-amber-300 mb-1">
              CREW VICTORY
            </h3>
            <p className="text-xs text-zinc-300 mb-3">
              Imposter <strong>Player 2</strong> was caught! Secret Word was <span className="text-amber-400 font-bold font-mono">"SPACESHIP"</span>.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
              <span>+180 XP Credited</span>
            </div>
          </div>
        )}
      </div>

      {/* Chapters Scrub Bar */}
      <div className="px-4 pt-3 bg-black/80 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-2">
          {CHAPTERS.map((chap) => {
            const isActive = activeChapter.id === chap.id;
            return (
              <button
                key={chap.id}
                onClick={() => jumpToChapter(chap.timestamp)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-white/5 border-transparent text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="block text-[9px] sm:text-[10px] font-mono tracking-wider text-zinc-400 truncate">
                  0{chap.id}
                </span>
                <span className="block text-[11px] sm:text-xs font-semibold truncate">
                  {chap.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Video Scrubber Slider */}
        <div className="relative flex items-center py-1">
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            step={0.5}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300"
          />
        </div>
      </div>

      {/* Video Bottom Controls Bar */}
      <div className="px-4 py-3 bg-black/90 flex items-center justify-between gap-4 text-xs font-mono text-zinc-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
              sounds.playClick();
            }}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition-transform active:scale-95 cursor-pointer shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-amber-400" />}
          </button>

          <span className="text-zinc-400 text-[11px]">
            <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(TOTAL_DURATION)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => jumpToChapter(0)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Replay from start"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
