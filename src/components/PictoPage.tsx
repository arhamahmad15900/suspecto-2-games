/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PictoPage — the Picto game lobby page (formerly HomePage).
 * Draw. Bluff. Expose. — real-time multiplayer drawing deduction.
 */

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Play, PlusCircle, Palette, Eye, Vote, ArrowRight,
  ShieldCheck, Smartphone, HelpCircle, Zap, Users, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from './Logo.js';

gsap.registerPlugin(ScrollTrigger);

export interface PictoPageProps {
  onOpenCreate: () => void;
  onOpenJoin: (code?: string) => void;
  onOpenHowToPlay: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenAuth: (message?: string) => void;
  onOpenProfile: () => void;
  onOpenRegister?: () => void;
  onGoHome: () => void;
}

/* ─── 3D card tilt on mouse move ─── */
function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const rx   = ((e.clientY - cy) / (rect.height / 2)) * -10;
      const ry   = ((e.clientX - cx) / (rect.width  / 2)) *  10;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)'; };
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave, { passive: true });
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);
}

/* ─── Animated counter ─── */
const Counter: React.FC<{ to: number; suffix?: string; label: string }> = ({ to, suffix = '', label }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: to, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
    });
  }, [to, suffix]);
  return (
    <div className="text-center">
      <span ref={ref} className="font-display text-3xl font-extrabold text-shimmer-gold">0{suffix}</span>
      <p className="text-xs text-[#475569] font-mono mt-1">{label}</p>
    </div>
  );
};

/* ─── Mechanic Card with 3D tilt ─── */
const MechanicCard: React.FC<{
  num: string; icon: React.ReactNode; title: string;
  desc: string; footer: string; accent?: 'gold' | 'violet' | 'crimson';
}> = ({ num, icon, title, desc, footer, accent = 'gold' }) => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref as React.RefObject<HTMLElement | null>);
  const glassClass = accent === 'gold' ? 'glass-gold' : accent === 'violet' ? 'glass-violet' : 'glass-crimson';
  const textColor  = accent === 'gold' ? '#F5A623'   : accent === 'violet' ? '#A78BFA'       : '#EF4444';
  const borderFt   = accent === 'gold'
    ? 'rgba(245,166,35,0.12)'
    : accent === 'violet' ? 'rgba(124,58,237,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <div
      ref={ref}
      className={`mechanic-card ${glassClass} card-float rounded-2xl p-7 flex flex-col justify-between`}
      style={{ transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease', willChange: 'transform' }}
    >
      <div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: `${textColor}14`, border: `1px solid ${textColor}30` }}>
          <span style={{ color: textColor }}>{icon}</span>
        </div>
        <span className="font-mono text-[10px] font-bold tracking-widest uppercase mb-2 block" style={{ color: textColor }}>Step {num}</span>
        <h3 className="font-display text-lg font-bold text-[#F8FAFC] mb-2">{title}</h3>
        <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
      </div>
      <div className="mt-6 pt-3 flex items-center gap-2 text-[11px] font-mono text-[#475569]" style={{ borderTop: `1px solid ${borderFt}` }}>
        <Zap size={10} style={{ color: `${textColor}70` }} />
        {footer}
      </div>
    </div>
  );
};

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export const PictoPage: React.FC<PictoPageProps> = ({
  onOpenCreate, onOpenJoin, onOpenHowToPlay, onOpenRules, onOpenHistory,
  onOpenAuth, onOpenRegister, onGoHome,
}) => {
  const { user } = useAuth();
  const [quickCode, setQuickCode] = useState('');
  const heroRef  = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const featRef  = useRef<HTMLElement>(null);
  const ctaRef   = useRef<HTMLDivElement>(null);

  /* GSAP entrance animations */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.picto-hero-reveal', {
        opacity: 0, y: 36, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.15,
      });
      gsap.from('.picto-hero-panel', {
        opacity: 0, x: 60, rotateY: -14, duration: 1.0, ease: 'power3.out', delay: 0.35,
        transformOrigin: 'left center',
      });
      gsap.from('.picto-stat-bar', {
        opacity: 0, y: 20, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.picto-stat-bar', start: 'top 88%', once: true },
      });
      if (cardsRef.current) {
        gsap.from(cardsRef.current.querySelectorAll('.mechanic-card'), {
          scrollTrigger: { trigger: cardsRef.current, start: 'top 78%', once: true },
          opacity: 0, y: 52, rotateX: 10, duration: 0.75, ease: 'power3.out',
          stagger: 0.14, transformOrigin: 'bottom center',
        });
      }
      if (featRef.current) {
        gsap.from(featRef.current.querySelectorAll('.picto-feat-item'), {
          scrollTrigger: { trigger: featRef.current, start: 'top 82%', once: true },
          opacity: 0, y: 28, duration: 0.6, ease: 'power3.out', stagger: 0.1,
        });
      }
      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          scrollTrigger: { trigger: ctaRef.current, start: 'top 84%', once: true },
          opacity: 0, scale: 0.95, y: 30, duration: 0.7, ease: 'power3.out',
        });
      }
      gsap.to('.picto-orb-gold',   { scrollTrigger: { trigger: heroRef.current, scrub: 2 }, y: -90 });
      gsap.to('.picto-orb-violet', { scrollTrigger: { trigger: heroRef.current, scrub: 3 }, y: -60 });
    });
    return () => ctx.revert();
  }, []);

  const handleCreate = () => { if (!user) { onOpenAuth('Sign in to host a room.'); return; } onOpenCreate(); };
  const handleJoin = (code?: string) => {
    if (!user) { onOpenAuth(code ? `Sign in to join room ${code}.` : 'Sign in to join a game room.'); return; }
    onOpenJoin(code);
  };
  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const c = quickCode.trim().toUpperCase();
    if (!c) return;
    handleJoin(c);
  };

  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden">

      {/* ══════════ HERO ══════════ */}
      <section
        ref={heroRef}
        className="relative w-full min-h-[calc(100vh-64px)] flex items-center overflow-hidden"
      >
        <div className="orb orb-gold picto-orb-gold" style={{ width: 700, height: 700, top: -200, left: -150, opacity: 0.7 }} />
        <div className="orb orb-violet picto-orb-violet" style={{ width: 500, height: 500, bottom: -100, right: -100, opacity: 0.6 }} />
        <div className="absolute inset-0 bg-grid opacity-60" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* LEFT: Copy */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start">

            {/* Back breadcrumb */}
            <div className="picto-hero-reveal mb-4">
              <button
                onClick={onGoHome}
                className="flex items-center gap-1.5 text-[#475569] hover:text-[#F5A623] transition-colors text-xs font-mono font-bold uppercase tracking-wider group"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:-translate-x-0.5 transition-transform">
                  <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                All Games
              </button>
            </div>

            <div className="picto-hero-reveal mb-5">
              <span className="badge badge-gold">
                <span className="pulse-dot relative w-1.5 h-1.5 rounded-full bg-[#F5A623] text-[#F5A623]" />
                Live Multiplayer · Real-time Drawing
              </span>
            </div>

            <h1 className="picto-hero-reveal font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.08] mb-4 sm:mb-5">
              Draw.{' '}
              <span className="text-shimmer-gold">Bluff.</span>
              <br />
              <span className="text-shimmer-violet">Expose.</span>
            </h1>

            <p className="picto-hero-reveal text-[#94A3B8] text-sm sm:text-lg leading-relaxed mb-6 sm:mb-7 max-w-lg">
              A real-time multiplayer deduction game. One secret word. One Imposter who doesn't have it. Take turns drawing strokes — then vote to expose the liar.
            </p>

            {!user && (
              <div className="picto-hero-reveal flex items-center gap-2.5 px-4 py-3 glass-gold rounded-xl text-xs sm:text-sm text-[#94A3B8] mb-6 sm:mb-7 max-w-md w-full">
                <ShieldCheck size={16} className="text-[#F5A623] shrink-0" />
                <span>Account required to host or join. Sign in to play.</span>
              </div>
            )}

            <div className="picto-hero-reveal flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-6">
              <button onClick={handleCreate} className="btn-gold min-h-[44px] py-3.5 px-7 gap-2 text-sm">
                <PlusCircle size={17} />
                {user ? 'Create Room' : 'Sign In to Host'}
              </button>
              <button onClick={() => handleJoin()} className="btn-ghost min-h-[44px] py-3.5 px-7 gap-2 text-sm">
                <Play size={17} />
                {user ? 'Join Game' : 'Sign In to Join'}
              </button>
            </div>

            <form
              onSubmit={handleQuickJoin}
              className="picto-hero-reveal w-full max-w-md p-1.5 glass rounded-2xl flex items-center gap-2 min-h-[46px]"
            >
              <input
                type="text"
                value={quickCode}
                onChange={e => setQuickCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE · E.G. K9P2X"
                maxLength={10}
                className="flex-1 bg-transparent px-3 py-2 text-base sm:text-xs font-mono font-bold tracking-widest text-[#F5A623] placeholder:text-[#2A3045] focus:outline-none uppercase"
              />
              <button
                type="submit"
                disabled={!quickCode.trim()}
                className="btn-ghost min-h-[38px] py-2 px-4 text-xs gap-1.5 rounded-xl disabled:opacity-30"
              >
                Join <ArrowRight size={12} />
              </button>
            </form>
          </div>

          {/* RIGHT: Illustration column (no 3D model here — it lives on the main landing) */}
          <div className="picto-hero-panel lg:col-span-6 xl:col-span-5">
            <div
              className="relative glass card-float rounded-3xl overflow-hidden glow-violet p-8 flex flex-col gap-6"
              style={{ minHeight: 'clamp(280px, 36vw, 440px)' }}
            >
              <div className="orb orb-gold absolute -right-10 -top-10 w-48 h-48 opacity-30 pointer-events-none" />
              <div className="orb orb-violet absolute -left-10 -bottom-10 w-40 h-40 opacity-25 pointer-events-none" />

              {/* Mini game-phase preview cards */}
              {[
                { step: '01', label: 'Secret Word Assigned', color: '#F5A623', icon: '🔐' },
                { step: '02', label: 'Everyone Draws Blind', color: '#A78BFA', icon: '✏️' },
                { step: '03', label: 'Vote Out the Imposter', color: '#EF4444', icon: '🗳️' },
              ].map((p) => (
                <div
                  key={p.step}
                  className="relative z-10 flex items-center gap-4 rounded-xl p-4 bg-black/30 border border-white/8"
                  style={{ borderColor: `${p.color}25` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: p.color }}>
                      Phase {p.step}
                    </span>
                    <p className="font-display font-semibold text-sm text-[#F8FAFC] mt-0.5">{p.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STAT BAR ══════════ */}
      <div
        className="picto-stat-bar w-full border-y border-[rgba(255,255,255,0.065)]"
        style={{ background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Counter to={12}  suffix="+"  label="Max Players" />
          <Counter to={60}  suffix="s"  label="Drawing Timer" />
          <Counter to={100} suffix="+"  label="Secret Words" />
          <Counter to={0}   suffix="ms" label="Avg Latency" />
        </div>
      </div>

      {/* ══════════ MECHANIC CARDS ══════════ */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="mb-12">
          <span className="badge badge-gold mb-3">Game Mechanics</span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">
            How the Game Works
          </h2>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MechanicCard
            num="01" icon={<Palette size={19} />} accent="gold"
            title="Take Turns Drawing"
            desc="Each player adds one stroke to a shared canvas. Crew Members hint at the secret word through their lines — without spelling it out."
            footer="30s Turn · Full Canvas Toolset"
          />
          <MechanicCard
            num="02" icon={<Eye size={19} />} accent="violet"
            title="Bluff as the Imposter"
            desc="The Imposter never sees the secret word. They must read the room, mirror the crew's intent, and draw convincing-enough strokes to survive."
            footer="Secret Role Assignment"
          />
          <MechanicCard
            num="03" icon={<Vote size={19} />} accent="crimson"
            title="Deliberate & Vote"
            desc="When the drawing ends, discuss using voice or text chat. Cast your vote. The suspect with the most votes is exposed."
            footer="Voice · Text Chat · Final Guess"
          />
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section ref={featRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <Smartphone size={18} />, title: 'Any Device', desc: 'Touch-optimized canvas with pixel-perfect sync across phones, tablets, and desktops.', acc: 'gold' },
            { icon: <Users size={18} />,      title: '2–12 Players', desc: 'Private rooms with shareable join links. No download, no install — just open a browser.', acc: 'violet' },
            { icon: <Trophy size={18} />,     title: 'Match History', desc: 'Track Crew & Imposter wins. Study your past games and sharpen your deduction skills.', acc: 'gold' },
          ].map(f => (
            <div
              key={f.title}
              className={`picto-feat-item glass card-float rounded-2xl p-5 flex gap-4 ${f.acc === 'violet' ? 'glass-violet' : 'glass-gold'}`}
            >
              <div
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                style={{
                  background: f.acc === 'violet' ? 'rgba(124,58,237,0.12)' : 'rgba(245,166,35,0.10)',
                  border: f.acc === 'violet' ? '1px solid rgba(124,58,237,0.28)' : '1px solid rgba(245,166,35,0.25)',
                  color: f.acc === 'violet' ? '#A78BFA' : '#F5A623',
                }}
              >
                {f.icon}
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-[#F8FAFC] mb-1">{f.title}</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div
          ref={ctaRef}
          className="relative overflow-hidden glass rounded-3xl p-10 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 glow-gold"
        >
          <div className="orb orb-gold absolute -right-20 -top-20 w-80 h-80 opacity-40" />
          <div className="orb orb-violet absolute -left-10 -bottom-10 w-60 h-60 opacity-30" />

          <div className="relative z-10">
            <span className="badge badge-gold mb-4">Cross-Platform</span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mb-3">
              Play on Any Device,<br />Anywhere, Any Time
            </h3>
            <p className="text-sm text-[#94A3B8] max-w-lg leading-relaxed">
              Real-time WebSocket sync ensures every stroke appears instantaneously for all players. Touch-optimized drawing maintains perfect alignment regardless of screen size.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            <button onClick={onOpenHowToPlay} className="btn-ghost py-3 px-5 text-sm gap-2">
              <HelpCircle size={15} /> How to Play
            </button>
            {!user && onOpenRegister ? (
              <button onClick={onOpenRegister} className="btn-gold py-3 px-6 text-sm gap-2">
                Register Free →
              </button>
            ) : (
              <button onClick={handleCreate} className="btn-gold py-3 px-6 text-sm gap-2">
                {user ? 'Host a Room' : 'Sign In to Host'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="w-full border-t border-[rgba(255,255,255,0.065)] py-8 px-4 text-xs text-[#475569]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Logo size="xs" />
            <span className="text-[#1E293B]">·</span>
            <span>Real-time multiplayer deduction game</span>
            <span className="text-[#1E293B]">·</span>
            <span>By <strong className="text-[#94A3B8] font-semibold">Arham Ahmad Khan</strong></span>
          </div>
          <div className="flex items-center gap-5 text-[#94A3B8]">
            <button onClick={onOpenHowToPlay} className="hover:text-[#F8FAFC] transition-colors">How to Play</button>
            <button onClick={onOpenRules}     className="hover:text-[#F8FAFC] transition-colors">Rules</button>
            <button onClick={onOpenHistory}   className="hover:text-[#F8FAFC] transition-colors">Match History</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
