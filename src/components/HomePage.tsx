/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HomePage — Main landing page for Suspecto.
 * Features the 3D model hero, a Games section with Picto, and the same
 * GSAP / ambient / scroll effect system as the rest of the site.
 */

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Gamepad2, ArrowRight, Sparkles, Users, Zap, HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from './Logo.js';
import { ThreeHero } from './ThreeHero.js';

gsap.registerPlugin(ScrollTrigger);

export interface HomePageProps {
  onOpenHowToPlay: () => void;
  onOpenRules: () => void;
  onOpenHistory: () => void;
  onOpenAuth: (message?: string) => void;
  onOpenProfile: () => void;
  onOpenRegister?: () => void;
  onEnterPicto: () => void;
  onEnterSketchio: () => void;
}

/* ═══════════════ GAME CARD ═══════════════ */
interface GameCardProps {
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  players: string;
  accentColor: string;
  accentColorDim: string;
  icon: React.ReactNode;
  badge?: string;
  onPlay: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  name, tagline, description, tags, players,
  accentColor, accentColorDim, icon, badge, onPlay,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const rx = ((e.clientY - rect.top  - rect.height / 2) / (rect.height / 2)) * -6;
      const ry = ((e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2)) *  6;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)'; };
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave, { passive: true });
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <div
      ref={ref}
      className="game-card group relative glass card-float rounded-3xl overflow-hidden flex flex-col cursor-pointer"
      style={{
        transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, border-color 0.3s ease',
        willChange: 'transform',
        borderColor: `${accentColor}22`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}55`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}22`; }}
      onClick={onPlay}
    >
      {/* Top accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}, ${accentColor}00)` }} />

      <div className="p-7 flex flex-col flex-1 gap-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, color: accentColor }}
          >
            {icon}
          </div>
          {badge && (
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
              style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}35`, color: accentColor }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className="font-display text-2xl font-black text-[#F8FAFC] mb-1 group-hover:text-white transition-colors">
            {name}
          </h3>
          <p className="text-xs font-mono font-bold uppercase tracking-widest mb-3" style={{ color: accentColor }}>
            {tagline}
          </p>
          <p className="text-sm text-[#94A3B8] leading-relaxed">{description}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map(t => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#475569]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${accentColor}18` }}>
          <div className="flex items-center gap-1.5 text-xs text-[#475569] font-mono">
            <Users size={12} style={{ color: accentColor }} />
            {players}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onPlay(); }}
            className="flex items-center gap-1.5 text-xs font-bold font-mono transition-all duration-200 group/btn"
            style={{ color: accentColor }}
          >
            Play Now
            <ArrowRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════ COMING SOON CARD ═══════════════ */
const ComingSoonCard: React.FC<{ name: string; description: string; icon: string; accentColor: string }> = ({
  name, description, icon, accentColor,
}) => (
  <div
    className="coming-soon-row relative glass rounded-3xl overflow-hidden flex flex-col opacity-55"
    style={{ borderColor: `${accentColor}18` }}
  >
    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}55, ${accentColor}00)` }} />
    <div className="p-7 flex flex-col flex-1 gap-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
          style={{ background: `${accentColor}0A`, border: `1px solid ${accentColor}20` }}
        >
          {icon}
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#475569' }}
        >
          Coming Soon
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-2xl font-black text-[#475569] mb-3">{name}</h3>
        <p className="text-sm text-[#2A3045] leading-relaxed">{description}</p>
      </div>
      <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-xs font-mono text-[#2A3045]">In development</span>
      </div>
    </div>
  </div>
);

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export const HomePage: React.FC<HomePageProps> = ({
  onOpenHowToPlay, onOpenRules, onOpenHistory, onOpenAuth, onOpenRegister, onEnterPicto, onEnterSketchio,
}) => {
  const { user } = useAuth();
  const heroRef  = useRef<HTMLElement>(null);
  const gamesRef = useRef<HTMLElement>(null);
  const ctaRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      /* Hero left column */
      gsap.from('.home-reveal', {
        opacity: 0, y: 36, duration: 0.85, ease: 'power3.out', stagger: 0.1, delay: 0.1,
      });
      /* 3D panel */
      gsap.from('.home-panel', {
        opacity: 0, x: 56, duration: 1.0, ease: 'power3.out', delay: 0.3,
      });
      /* Games section */
      if (gamesRef.current) {
        gsap.from(gamesRef.current.querySelectorAll('.game-card'), {
          scrollTrigger: { trigger: gamesRef.current, start: 'top 78%', once: true },
          opacity: 0, y: 50, rotateX: 8, duration: 0.8, ease: 'power3.out',
          stagger: 0.16, transformOrigin: 'bottom center',
        });
        gsap.from(gamesRef.current.querySelectorAll('.coming-soon-row'), {
          scrollTrigger: { trigger: gamesRef.current, start: 'top 60%', once: true },
          opacity: 0, y: 30, duration: 0.7, ease: 'power3.out', stagger: 0.12,
        });
      }
      /* CTA */
      if (ctaRef.current) {
        gsap.from(ctaRef.current, {
          scrollTrigger: { trigger: ctaRef.current, start: 'top 84%', once: true },
          opacity: 0, scale: 0.95, y: 30, duration: 0.7, ease: 'power3.out',
        });
      }
      /* Parallax orbs */
      gsap.to('.home-orb-gold',   { scrollTrigger: { trigger: heroRef.current, scrub: 2 }, y: -90 });
      gsap.to('.home-orb-violet', { scrollTrigger: { trigger: heroRef.current, scrub: 3 }, y: -60 });
    });
    return () => ctx.revert();
  }, []);

  const handlePlayPicto = () => {
    if (!user) {
      onOpenAuth('Sign in to host or join a Picto room.');
      return;
    }
    onEnterPicto();
  };

  const handlePlaySketchio = () => {
    if (!user) {
      onOpenAuth('Sign in to host or join a Sketchio room.');
      return;
    }
    onEnterSketchio();
  };

  const scrollToGames = () => {
    gamesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden">

      {/* ══════════════════════════════════════
          HERO — 3D Model + headline
      ══════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative w-full min-h-[calc(100vh-64px)] flex items-center overflow-hidden"
      >
        {/* Ambient orbs */}
        <div className="orb orb-gold  home-orb-gold"   style={{ width: 700, height: 700, top: -200,  left: -150, opacity: 0.7 }} />
        <div className="orb orb-violet home-orb-violet" style={{ width: 500, height: 500, bottom: -100, right: -100, opacity: 0.6 }} />
        <div className="absolute inset-0 bg-grid opacity-60" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* LEFT: Headline */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="home-reveal mb-5">
              <span className="badge badge-gold">
                <span className="pulse-dot relative w-1.5 h-1.5 rounded-full bg-[#F5A623] text-[#F5A623]" />
                Browser-based · No download needed
              </span>
            </div>

            <h1 className="home-reveal font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.06] mb-5">
              Games for{' '}
              <span className="text-shimmer-gold">every</span>
              <br />
              <span className="text-shimmer-violet">room.</span>
            </h1>

            <p className="home-reveal text-[#94A3B8] text-sm sm:text-lg leading-relaxed mb-8 max-w-md">
              Real-time multiplayer party games you can play instantly in any browser.
              No installs. No accounts to share. Just a room code.
            </p>

            <div className="home-reveal flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={scrollToGames}
                className="btn-gold min-h-[48px] py-3.5 px-8 gap-2 text-sm"
              >
                <Gamepad2 size={17} />
                Browse Games
              </button>
              {!user && onOpenRegister && (
                <button
                  onClick={onOpenRegister}
                  className="btn-ghost min-h-[48px] py-3.5 px-7 gap-2 text-sm"
                >
                  <Sparkles size={15} />
                  Create Free Account
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: 3D model */}
          <div className="home-panel lg:col-span-7">
            <div
              className="relative glass card-float rounded-3xl overflow-hidden glow-violet"
              style={{ height: 'clamp(340px, 45vw, 580px)' }}
            >
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="badge badge-gold">
                  <span className="pulse-dot relative w-1.5 h-1.5 rounded-full bg-[#F5A623] text-[#F5A623]" />
                  3D Model · Interactive
                </span>
              </div>
              <ThreeHero />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          GAMES SECTION
      ══════════════════════════════════════ */}
      <section
        ref={gamesRef}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28"
      >
        {/* Section header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-gold">
              <Gamepad2 size={11} />
              Games
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#F8FAFC] tracking-tight leading-tight">
            Pick your game
          </h2>
          <p className="mt-3 text-[#475569] text-sm sm:text-base max-w-xl leading-relaxed">
            Each game runs directly in your browser with real-time multiplayer.
            Share a room code — everyone joins instantly.
          </p>
        </div>

        {/* ── Active games grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <GameCard
            name="Picto"
            tagline="Draw · Bluff · Expose"
            description="One secret word, one hidden imposter. Take turns adding strokes to a shared canvas, then vote to expose the liar before they guess the word."
            tags={['Drawing', 'Deduction', 'Voice Chat', '2–12 Players']}
            players="2–12 players"
            accentColor="#F5A623"
            accentColorDim="#A67315"
            icon={<span className="text-2xl">🎨</span>}
            badge="Available Now"
            onPlay={handlePlayPicto}
          />
          <GameCard
            name="Sketchio"
            tagline="Draw · Guess · Score"
            description="One player draws, everyone else races to guess the word. Faster guesses score more. Take turns until the last round — highest score wins."
            tags={['Drawing', 'Guessing', 'Speed Scoring', '2–12 Players']}
            players="2–12 players"
            accentColor="#22D3EE"
            accentColorDim="#0E7490"
            icon={<span className="text-2xl">✏️</span>}
            badge="Available Now"
            onPlay={handlePlaySketchio}
          />
          <ComingSoonCard
            name="Codeword"
            description="Give one-word clues to link secret words while avoiding the assassin card. Team strategy meets wordplay."
            icon="🔡"
            accentColor="#A78BFA"
          />
          <ComingSoonCard
            name="Faker"
            description="A fast social deduction game. One player gets a different topic — the others ask questions to flush them out."
            icon="🕵️"
            accentColor="#EF4444"
          />
        </div>

        {/* ── Feature pills row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Zap size={15} />,       color: '#F5A623', label: 'Instant play',    sub: 'No download, no install — open any browser and share a code.' },
            { icon: <Users size={15} />,      color: '#A78BFA', label: 'Real-time sync',  sub: 'WebSocket-powered rooms keep every player perfectly in step.' },
            { icon: <Gamepad2 size={15} />,   color: '#22D3EE', label: 'Cross-device',    sub: 'Touch-optimized for phones, tablets, and desktops alike.' },
          ].map(p => (
            <div
              key={p.label}
              className="coming-soon-row flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${p.color}12`, border: `1px solid ${p.color}28`, color: p.color }}
              >
                {p.icon}
              </div>
              <div>
                <p className="font-display font-bold text-sm text-[#F8FAFC] mb-0.5">{p.label}</p>
                <p className="text-xs text-[#475569] leading-relaxed">{p.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div
          ref={ctaRef}
          className="relative overflow-hidden glass rounded-3xl p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-8 glow-gold"
        >
          <div className="orb orb-gold   absolute -right-20 -top-20   w-80 h-80 opacity-40" />
          <div className="orb orb-violet absolute -left-10  -bottom-10 w-60 h-60 opacity-30" />

          <div className="relative z-10">
            <span className="badge badge-gold mb-4">Ready to play?</span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mb-3">
              Jump into a room
            </h3>
            <p className="text-sm text-[#94A3B8] max-w-lg leading-relaxed">
              Create a free account to host Picto or Sketchio rooms, track match history, and unlock drawing tools.
              Or sign in and start playing in seconds.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            <button onClick={onOpenHowToPlay} className="btn-ghost py-3 px-5 text-sm gap-2">
              <HelpCircle size={15} /> How to Play
            </button>
            {!user && onOpenRegister ? (
              <button onClick={onOpenRegister} className="btn-gold py-3 px-7 text-sm gap-2">
                Create Free Account →
              </button>
            ) : (
              <button onClick={scrollToGames} className="btn-gold py-3 px-7 text-sm gap-2">
                {user ? 'Browse Games →' : 'Sign In to Play →'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="w-full border-t border-[rgba(255,255,255,0.065)] py-8 px-4 text-xs text-[#475569]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <Logo size="xs" />
            <span className="text-[#1E293B]">·</span>
            <span>Real-time multiplayer party games</span>
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
