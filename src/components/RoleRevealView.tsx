/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Eye, Shield, Check, Clock, Sparkles, DoorOpen, AlertOctagon, Lock, Fingerprint } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { sounds } from '../services/sound.js';
import { gsap } from 'gsap';
import imposterRoleImg from '../assets/images/game_role_imposter_1790507504500.jpg';
import crewRoleImg from '../assets/images/game_role_crew_1790507491475.jpg';

export const RoleRevealView: React.FC = () => {
  const { privateInfo, roomState, readyMatch, leaveRoom, timeRemainingSeconds, myPlayerInfo } = useGame();
  const cardRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isImposter = privateInfo?.role === 'IMPOSTER';
  const isReady = !!myPlayerInfo?.isReady;

  // Sound effect & GSAP Entrance sequence
  useEffect(() => {
    sounds.playRoleReveal();

    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      // Dossier card slam in
      gsap.fromTo(
        cardRef.current,
        { scale: 0.88, opacity: 0, y: 30, rotationX: 15 },
        { scale: 1, opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: 'back.out(1.5)' }
      );

      // Stamp slam down with overshoot
      if (stampRef.current) {
        gsap.fromTo(
          stampRef.current,
          { scale: 3.5, opacity: 0, rotation: -28 },
          { scale: 1, opacity: 0.9, rotation: -12, duration: 0.5, delay: 0.45, ease: 'power4.out' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 3D Card tilt effect on mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -6;
    const tiltY = (x / (rect.width / 2)) * 6;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  if (!privateInfo || !roomState) return null;

  return (
    <div
      ref={containerRef}
      className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 relative overflow-hidden"
    >
      {/* Dynamic Ambient Background Glows */}
      <div
        className={`absolute w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-1000 ${
          isImposter
            ? 'bg-rose-600/20 top-1/4 left-1/2 -translate-x-1/2'
            : 'bg-amber-500/18 top-1/4 left-1/2 -translate-x-1/2'
        }`}
      />
      <div className="absolute w-80 h-80 rounded-full blur-[120px] bg-purple-600/10 bottom-10 left-10 pointer-events-none" />

      {/* Main Dossier Container */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ transition: 'transform 0.15s ease-out, box-shadow 0.3s ease' }}
        className={`w-full max-w-lg relative rounded-2xl p-6 sm:p-9 text-center backdrop-blur-2xl border transition-all ${
          isImposter
            ? 'bg-[#140b0f]/85 border-red-500/40 shadow-[0_0_50px_rgba(230,57,70,0.22)]'
            : 'bg-[#14120e]/85 border-amber-500/40 shadow-[0_0_50px_rgba(245,166,35,0.22)]'
        }`}
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
        />

        {/* TOP SECRET / CLASSIFIED STAMP */}
        <div
          ref={stampRef}
          className={`absolute top-10 right-6 sm:right-10 pointer-events-none select-none z-20 font-mono font-black text-xs sm:text-sm tracking-[0.25em] px-3 py-1 border-2 rounded uppercase ${
            isImposter
              ? 'text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'text-amber-400 border-amber-400 shadow-[0_0_15px_rgba(245,166,35,0.5)]'
          }`}
        >
          {isImposter ? '⚡ CLASSIFIED' : '✦ DOSSIER'}
        </div>

        {/* Header & Match Timer */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2">
            <Fingerprint
              size={18}
              className={isImposter ? 'text-red-400 animate-pulse' : 'text-amber-400'}
            />
            <span className="text-[11px] uppercase tracking-widest font-mono font-semibold text-zinc-400">
              Confidential Dossier
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-400 bg-black/60 px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-inner">
              <Clock size={13} className="animate-spin-slow" />
              <span>{timeRemainingSeconds}s</span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Leave active game room?')) {
                  leaveRoom();
                }
              }}
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
              title="Leave Room"
            >
              <DoorOpen size={16} />
            </button>
          </div>
        </div>

        {/* Identity Portrait with holographic frame */}
        <div className="relative w-36 h-40 mx-auto mb-6 rounded-xl overflow-hidden border p-1 shadow-2xl relative z-10 transition-transform hover:scale-105 duration-300">
          <div
            className={`absolute inset-0 rounded-xl blur-sm ${
              isImposter ? 'bg-red-500/30' : 'bg-amber-400/30'
            }`}
          />
          <div className="w-full h-full rounded-lg overflow-hidden relative z-10 bg-black/50 border border-white/15">
            <img
              src={isImposter ? imposterRoleImg : crewRoleImg}
              alt={isImposter ? 'Imposter Persona' : 'Crew Member Artist'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover saturate-[1.15] contrast-[1.05]"
            />
            {/* Scanline overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent pointer-events-none animate-scanline" />
          </div>
        </div>

        {/* Role Designation Title */}
        <div className="mb-5 relative z-10">
          <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-400 block mb-1">
            Identity Assigned
          </span>
          <h2
            className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isImposter
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_0_20px_rgba(245,166,35,0.5)]'
            }`}
          >
            {isImposter ? 'YOU ARE THE IMPOSTER' : 'YOU ARE A CREW MEMBER'}
          </h2>
        </div>

        {/* Role Directives / Secret Word Intel */}
        {isImposter ? (
          <div className="p-5 bg-black/60 border border-red-500/30 rounded-xl text-left mb-6 shadow-inner relative z-10 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2 text-red-400">
              <AlertOctagon size={16} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Mission Directives</span>
            </div>
            <p className="text-xs font-semibold text-rose-200/90 mb-1.5 leading-relaxed">
              You do NOT know the secret word.
            </p>
            <p className="text-[12px] text-zinc-400 leading-relaxed">
              Closely observe player strokes, sketch plausible lines that blend in naturally, and bluff your way through the final vote.
            </p>
          </div>
        ) : (
          <div className="mb-6 relative z-10">
            <div className="p-5 bg-black/60 border border-amber-500/35 rounded-xl mb-3 shadow-inner text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-2 right-2 text-amber-500/20">
                <Lock size={36} />
              </div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block mb-1">
                TOP SECRET WORD
              </span>
              <span className="font-display text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-200 tracking-wider block drop-shadow-md">
                {privateInfo.secretWord}
              </span>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-mono">
                <span>Category:</span>
                <span className="font-bold">{roomState.settings.wordCategory}</span>
              </div>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed text-center">
              Draw subtle, clever clues so your fellow crew recognize you, without giving the secret away to the hidden imposter.
            </p>
          </div>
        )}

        {/* Ready Action Button */}
        <div className="relative z-10">
          <button
            onClick={() => {
              sounds.playClick();
              readyMatch();
            }}
            disabled={isReady}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isReady
                ? 'bg-zinc-900/80 text-amber-400 border border-amber-500/30 cursor-default opacity-85'
                : isImposter
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-900/40 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] active:scale-[0.98]'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-amber-900/30 hover:shadow-[0_0_25px_rgba(245,166,35,0.5)] active:scale-[0.98]'
            }`}
          >
            {isReady ? (
              <>
                <Check size={18} className="text-amber-400 animate-pulse" />
                <span className="font-mono tracking-wide">Dossier Acknowledged. Waiting...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Acknowledge & Proceed</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
