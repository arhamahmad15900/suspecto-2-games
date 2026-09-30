/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Trophy, Skull, RotateCcw, Home, Sparkles, CheckCircle2, XCircle, ShieldCheck, Download, Share2 } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { Logo } from './Logo.js';
import { sounds } from '../services/sound.js';
import { gsap } from 'gsap';

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

function colorMatch(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  tolerance: number = 32
): boolean {
  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance &&
    Math.abs(a1 - a2) <= tolerance
  );
}

function performFloodFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColorHex: string
) {
  const x0 = Math.round(startX);
  const y0 = Math.round(startY);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIndex = (y0 * width + x0) * 4;
  const startR = data[startIndex];
  const startG = data[startIndex + 1];
  const startB = data[startIndex + 2];
  const startA = data[startIndex + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColorHex);

  if (colorMatch(startR, startG, startB, startA, fillR, fillG, fillB, fillA, 5)) {
    return;
  }

  const visited = new Uint8Array(width * height);
  const queue: number[] = [x0 + y0 * width];
  visited[x0 + y0 * width] = 1;

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % width;
    const y = Math.floor(pos / width);

    const idx = (y * width + x) * 4;
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    const neighbors = [
      x > 0 ? pos - 1 : -1,
      x < width - 1 ? pos + 1 : -1,
      y > 0 ? pos - width : -1,
      y < height - 1 ? pos + width : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const nIdx = n * 4;
        if (
          colorMatch(
            data[nIdx],
            data[nIdx + 1],
            data[nIdx + 2],
            data[nIdx + 3],
            startR,
            startG,
            startB,
            startA,
            36
          )
        ) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export const GameOverView: React.FC = () => {
  const { roomState, amIHost, hostRestartGame, leaveRoom, strokes } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);

  const isCrewWinner = roomState?.winner === 'CREW';

  // Sound & GSAP animation sequence
  useEffect(() => {
    if (isCrewWinner) {
      sounds.playVictory();
    } else {
      sounds.playElimination();
    }

    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Bounce down trophy/skull
      if (trophyRef.current) {
        gsap.fromTo(
          trophyRef.current,
          { scale: 0, rotation: -25, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.9, ease: 'elastic.out(1, 0.4)' }
        );
      }

      // Stagger elements in
      gsap.fromTo(
        '.game-over-stagger',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.25 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isCrewWinner]);

  // Render static replay preview of all strokes and fills on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !strokes) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = 600);
    const height = (canvas.height = 450);

    ctx.fillStyle = '#08080C';
    ctx.fillRect(0, 0, width, height);

    const scale = width / 800;

    for (const stroke of strokes) {
      if (stroke.isFill && stroke.fillPoint) {
        performFloodFill(
          ctx,
          width,
          height,
          stroke.fillPoint.x * width,
          stroke.fillPoint.y * height,
          stroke.color
        );
      } else if (stroke.points && stroke.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.isEraser ? '#08080C' : stroke.color;
        ctx.lineWidth = Math.max(1, stroke.size * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const first = stroke.points[0];
        ctx.moveTo(first.x * width, first.y * height);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * width, pt.y * height);
        }
        ctx.stroke();
      }
    }
  }, [strokes]);

  const handleDownloadCanvas = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspecto-${roomState?.roomCode || 'match'}-artwork.png`;
    a.click();
  };

  if (!roomState) return null;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden"
    >
      {/* Ambient background glows */}
      <div
        className={`absolute w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none transition-all duration-1000 ${
          isCrewWinner ? 'bg-amber-500/15 top-1/4 left-1/2 -translate-x-1/2' : 'bg-red-600/18 top-1/4 left-1/2 -translate-x-1/2'
        }`}
      />
      <div className="absolute w-96 h-96 rounded-full blur-[130px] bg-purple-600/10 bottom-10 right-10 pointer-events-none" />

      {/* Main Game Over Card */}
      <div className="w-full max-w-2xl relative rounded-2xl p-6 sm:p-9 bg-[#111116]/90 border border-white/10 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] text-center">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Brand Header */}
        <div className="flex justify-center mb-5 game-over-stagger">
          <Logo size="sm" />
        </div>

        {/* Victory Emblem with Holographic Halo */}
        <div
          ref={trophyRef}
          className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 border relative shadow-2xl ${
            isCrewWinner
              ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_35px_rgba(245,166,35,0.4)]'
              : 'bg-gradient-to-br from-red-600/20 to-rose-600/10 border-red-500/50 text-red-400 shadow-[0_0_35px_rgba(239,68,68,0.4)]'
          }`}
        >
          {isCrewWinner ? (
            <Trophy size={42} className="drop-shadow-[0_0_10px_rgba(245,166,35,0.8)]" />
          ) : (
            <Skull size={42} className="drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          )}
        </div>

        {/* Outcome Headline */}
        <div className="game-over-stagger mb-5">
          <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-zinc-400 block mb-1">
            Investigation Concluded
          </span>
          <h2
            className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isCrewWinner
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_20px_rgba(245,166,35,0.5)]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            }`}
          >
            {isCrewWinner ? 'Crew Deciphered the Case' : 'The Imposter Evaded Detection'}
          </h2>
        </div>

        {/* Imposter Guess Result Note if applicable */}
        {roomState.imposterGuessResult && (
          <div className="game-over-stagger p-3.5 bg-black/50 rounded-xl border border-white/10 text-xs mb-6 inline-flex items-center gap-2 backdrop-blur-md">
            {roomState.imposterGuessResult.isCorrect ? (
              <CheckCircle2 size={16} className="text-amber-400" />
            ) : (
              <XCircle size={16} className="text-red-400" />
            )}
            <span className="text-zinc-300">
              Imposter Final Guess: <strong className="text-white">"{roomState.imposterGuessResult.guess}"</strong>{' '}
              <span className={roomState.imposterGuessResult.isCorrect ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'}>
                ({roomState.imposterGuessResult.isCorrect ? 'Correct Guess — Imposter Win!' : 'Incorrect Guess'})
              </span>
            </span>
          </div>
        )}

        {/* Reveal Showcase Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-left game-over-stagger">
          {/* Secret Word Box */}
          <div className="p-5 bg-black/60 rounded-xl border border-amber-500/25 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 block mb-1">
              Top Secret Word
            </span>
            <span className="font-display text-2xl font-bold text-white tracking-wide block">
              {roomState.revealedSecretWord || 'Hidden'}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono block mt-1.5">
              Category: <span className="text-amber-300">{roomState.settings.wordCategory}</span>
            </span>
          </div>

          {/* Imposter Identity Box */}
          <div className="p-5 bg-black/60 rounded-xl border border-red-500/25 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-red-400 block mb-1">
              Hidden Suspect Identity
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {roomState.revealedImposters?.map((imp) => (
                <span key={imp.id} className="font-display text-2xl font-bold text-red-400">
                  {imp.username}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono block mt-1.5">
              Status:{' '}
              <span className={isCrewWinner ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {isCrewWinner ? 'Exposed & Voted Out' : 'Undetected / Survived'}
              </span>
            </span>
          </div>
        </div>

        {/* Canvas Showcase Gallery */}
        <div className="mb-6 text-left game-over-stagger">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Final Match Canvas Archive
            </span>
            <button
              onClick={handleDownloadCanvas}
              className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Save PNG</span>
            </button>
          </div>
          <div className="w-full aspect-[4/3] bg-[#08080C] border border-white/15 rounded-xl overflow-hidden shadow-2xl relative">
            <canvas ref={canvasRef} className="w-full h-full block" />
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-zinc-400 pointer-events-none">
              Suspecto Canvas Archive
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 game-over-stagger">
          {amIHost && (
            <button
              onClick={() => {
                sounds.playClick();
                hostRestartGame();
              }}
              className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30 hover:shadow-[0_0_20px_rgba(245,166,35,0.4)] active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              <span>Return to Lobby</span>
            </button>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              leaveRoom();
            }}
            className="w-full sm:w-auto py-3.5 px-6 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-white/15 hover:border-white/25 active:scale-[0.98]"
          >
            <Home size={16} />
            <span>Leave Match</span>
          </button>
        </div>

        {/* Creator Attribution */}
        <div className="pt-4 border-t border-white/10 text-center text-xs text-zinc-500 game-over-stagger font-mono">
          <span>Developed with passion by </span>
          <span className="font-semibold text-zinc-300">Arham Ahmad Khan</span>
        </div>
      </div>
    </div>
  );
};
