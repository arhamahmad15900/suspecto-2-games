/**
 * SketchioPage — landing/join page for Sketchio.
 * Same glass, 3D tilt, GSAP scroll, and ambient system as Picto / Home.
 */
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Pencil, Play, PlusCircle, ArrowLeft, ArrowRight,
  Users, Clock, Zap, CheckCircle2, AlertCircle, Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useSketchio } from '../context/SketchioContext.js';
import { Logo } from './Logo.js';
import { sounds } from '../services/sound.js';

gsap.registerPlugin(ScrollTrigger);

interface SketchioPageProps {
  onGoHome: () => void;
  onOpenRegister?: () => void;
  onOpenAuth?: (msg?: string) => void;
}

function useTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const rx = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -8;
      const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 8;
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
    };
    const onLeave = () => {
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);
}

const TiltCard: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children, className, style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: 'transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease, border-color 0.3s ease',
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const SketchioPage: React.FC<SketchioPageProps> = ({ onGoHome, onOpenRegister, onOpenAuth }) => {
  const { user } = useAuth();
  const { skCreateAndJoin, skJoin, skError, clearSkError, skConnectionStatus } = useSketchio();

  const [joinCode, setJoinCode]     = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining]   = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLElement>(null);

  const error = localError || skError;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.sk-reveal', {
        opacity: 0, y: 36, duration: 0.8, ease: 'power3.out', stagger: 0.1, delay: 0.12,
      });
      gsap.from('.sk-hero-panel', {
        opacity: 0, x: 56, rotateY: -12, duration: 1.0, ease: 'power3.out', delay: 0.3,
        transformOrigin: 'left center',
      });
      if (cardsRef.current) {
        gsap.from(cardsRef.current.querySelectorAll('.sk-action-card'), {
          scrollTrigger: { trigger: cardsRef.current, start: 'top 82%', once: true },
          opacity: 0, y: 44, rotateX: 8, duration: 0.75, ease: 'power3.out',
          stagger: 0.14, transformOrigin: 'bottom center',
        });
      }
      if (stepsRef.current) {
        gsap.from(stepsRef.current.querySelectorAll('.sk-step-card'), {
          scrollTrigger: { trigger: stepsRef.current, start: 'top 80%', once: true },
          opacity: 0, y: 36, duration: 0.7, ease: 'power3.out', stagger: 0.12,
        });
      }
      gsap.to('.sk-orb-cyan', { scrollTrigger: { trigger: heroRef.current, scrub: 2 }, y: -80 });
      gsap.to('.sk-orb-violet', { scrollTrigger: { trigger: heroRef.current, scrub: 3 }, y: -50 });
    });
    return () => ctx.revert();
  }, []);

  const requireAuth = (msg: string): boolean => {
    if (!user) {
      if (onOpenAuth) onOpenAuth(msg);
      else if (onOpenRegister) onOpenRegister();
      return true;
    }
    return false;
  };

  const handleCreate = async () => {
    if (requireAuth('Sign in to create a Sketchio room.')) return;
    sounds.playClick();
    setLocalError(null); clearSkError();
    setIsCreating(true);
    try { await skCreateAndJoin(); }
    catch (e: any) { setLocalError(e.message || 'Could not create room.'); }
    finally { setIsCreating(false); }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireAuth('Sign in to join a Sketchio room.')) return;
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    sounds.playClick();
    setLocalError(null); clearSkError();
    setIsJoining(true);
    try { await skJoin(code); }
    catch (e: any) { setLocalError(e.message || 'Could not find room.'); }
    finally { setIsJoining(false); }
  };

  return (
    <div className="w-full flex flex-col items-center overflow-x-hidden">
      <section
        ref={heroRef}
        className="relative w-full min-h-[calc(100vh-64px)] flex items-center overflow-hidden"
      >
        <div className="orb orb-gold sk-orb-cyan" style={{ width: 640, height: 640, top: -180, left: -140, opacity: 0.45, background: 'radial-gradient(circle, rgba(34,211,238,0.28) 0%, transparent 70%)' }} />
        <div className="orb orb-violet sk-orb-violet" style={{ width: 480, height: 480, bottom: -80, right: -80, opacity: 0.55 }} />
        <div className="absolute inset-0 bg-grid opacity-60" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="sk-reveal mb-4">
              <button
                onClick={() => { sounds.playClick(); onGoHome(); }}
                className="flex items-center gap-1.5 text-[#475569] hover:text-[#22D3EE] transition-colors text-xs font-mono font-bold uppercase tracking-wider group"
              >
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                All Games
              </button>
            </div>

            <div className="sk-reveal mb-5">
              <span className="badge badge-gold" style={{ color: '#22D3EE', borderColor: 'rgba(34,211,238,0.35)', background: 'rgba(34,211,238,0.1)' }}>
                <span className="pulse-dot relative w-1.5 h-1.5 rounded-full bg-[#22D3EE] text-[#22D3EE]" />
                Draw · Guess · Score
              </span>
            </div>

            <h1 className="sk-reveal font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F8FAFC] tracking-tight leading-[1.06] mb-5">
              Sketchio
            </h1>

            <p className="sk-reveal text-[#94A3B8] text-sm sm:text-lg leading-relaxed mb-8 max-w-lg">
              One player draws, everyone else races to guess the word. Faster guesses earn more points.
              After every player has drawn, the highest score wins.
            </p>

            {error && (
              <div className="sk-reveal mb-6 w-full max-w-md p-3.5 rounded-xl bg-red-500/12 border border-red-500/35 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => { setLocalError(null); clearSkError(); }} className="text-red-400 hover:text-red-200 cursor-pointer">✕</button>
              </div>
            )}

            <div ref={cardsRef} className="sk-reveal grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
              <TiltCard className="sk-action-card glass rounded-2xl p-5 border border-[#22D3EE]/20 flex flex-col gap-4 hover:border-[#22D3EE]/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PlusCircle size={16} className="text-[#22D3EE]" />
                    <h3 className="font-display font-black text-lg text-white">Create Room</h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Start a private room. Share the 5-letter code with friends.
                  </p>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || skConnectionStatus === 'connecting'}
                  className="w-full py-3.5 rounded-xl font-display font-black text-sm text-[#08090E] bg-gradient-to-r from-[#22D3EE] to-[#38BDF8] hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={15} />
                  {isCreating ? 'Creating…' : user ? 'Create Room' : 'Sign In to Create'}
                </button>
              </TiltCard>

              <TiltCard className="sk-action-card glass rounded-2xl p-5 border border-[#A78BFA]/20 flex flex-col gap-4 hover:border-[#A78BFA]/40">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Play size={16} className="text-[#A78BFA]" />
                    <h3 className="font-display font-black text-lg text-white">Join Room</h3>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Enter the 5-letter code your friend shared to jump in.
                  </p>
                </div>
                <form onSubmit={handleJoin} className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE · E.G. A3X9Z"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#28303F] focus:border-[#A78BFA]/60 text-base sm:text-sm font-mono font-bold tracking-widest text-[#A78BFA] placeholder:text-[#2A3045] focus:outline-none transition-colors uppercase"
                  />
                  <button
                    type="submit"
                    disabled={!joinCode.trim() || isJoining || skConnectionStatus === 'connecting'}
                    className="w-full py-3 rounded-xl font-display font-black text-sm border border-[#A78BFA]/35 bg-[#A78BFA]/10 text-[#A78BFA] hover:bg-[#A78BFA]/20 disabled:opacity-35 transition-colors cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <ArrowRight size={14} />
                    {isJoining ? 'Joining…' : 'Join Room'}
                  </button>
                </form>
              </TiltCard>
            </div>
          </div>

          <div className="sk-hero-panel lg:col-span-6">
            <div className="relative glass card-float rounded-3xl overflow-hidden glow-violet p-8 flex flex-col gap-5 min-h-[340px]">
              <div className="orb orb-gold absolute -right-10 -top-10 w-48 h-48 opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)' }} />
              {[
                { step: '01', label: 'Drawer picks a word', color: '#22D3EE', icon: '✏️' },
                { step: '02', label: 'Everyone races to guess', color: '#F5A623', icon: '⚡' },
                { step: '03', label: 'Highest score wins', color: '#A78BFA', icon: '🏆' },
              ].map(p => (
                <div
                  key={p.step}
                  className="relative z-10 flex items-center gap-4 rounded-xl p-4 bg-black/30 border border-white/8"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${p.color}14`, border: `1px solid ${p.color}30` }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: p.color }}>
                      Step {p.step}
                    </p>
                    <p className="font-display font-bold text-sm text-[#F8FAFC]">{p.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={stepsRef} className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="font-display text-2xl sm:text-3xl font-black text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { step: '01', icon: <Pencil size={16} />, color: '#22D3EE', title: 'Draw a Word', desc: 'The drawer picks from 3 words (easy / medium / hard) and sketches it before time runs out.' },
            { step: '02', icon: <Zap size={16} />,    color: '#F5A623', title: 'Guess Fast', desc: 'Type guesses in chat. Correct answers score more the faster you are. Close guesses get a private hint.' },
            { step: '03', icon: <Trophy size={16} />,  color: '#A78BFA', title: 'Take Turns', desc: 'Every player draws each round. After all rounds, the highest score wins.' },
          ].map(s => (
            <TiltCard
              key={s.step}
              className="sk-step-card p-5 rounded-2xl flex flex-col gap-3"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}12`, border: `1px solid ${s.color}28`, color: s.color }}>
                  {s.icon}
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#475569]">Step {s.step}</span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#E6E8EC]">{s.title}</h4>
              <p className="text-xs text-[#475569] leading-relaxed">{s.desc}</p>
            </TiltCard>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <CheckCircle2 size={12} />, text: '2–12 Players',   color: '#22D3EE' },
            { icon: <Clock size={12} />,        text: '40–120s/round',  color: '#F5A623' },
            { icon: <Zap size={12} />,          text: 'Speed Scoring',  color: '#A78BFA' },
            { icon: <Users size={12} />,        text: 'Hint System',    color: '#22D3EE' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: f.color }}>{f.icon}</span>
              <span className="text-xs text-[#475569] font-mono">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="w-full border-t border-[rgba(255,255,255,0.065)] py-6 px-4 text-xs text-[#475569]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size="xs" />
            <span className="text-[#1E293B]">·</span>
            <span>Sketchio</span>
          </div>
          <button onClick={onGoHome} className="hover:text-[#F8FAFC] transition-colors font-mono">← All Games</button>
        </div>
      </footer>
    </div>
  );
};
