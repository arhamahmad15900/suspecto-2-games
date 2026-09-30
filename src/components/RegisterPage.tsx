/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RegisterPage — Suspecto registration & login page with GSAP scroll animations,
 * interactive profile preview, embedded gameplay demo, and phase gallery.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  ArrowLeft,
  Palette,
  Zap,
  ChevronDown,
  Layers,
  Radio,
  Award,
  Video,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { AVATAR_LIST } from '../utils/avatars.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { Logo } from './Logo.js';
import { GameplayVideoPlayer } from './GameplayVideoPlayer.js';
import { GameplayPhotoGallery } from './GameplayPhotoGallery.js';
import { sounds } from '../services/sound.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface RegisterPageProps {
  onBackToHome: () => void;
  onSuccessRedirect?: () => void;
  initialMode?: 'register' | 'login';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onBackToHome,
  onSuccessRedirect,
  initialMode = 'register',
}) => {
  const { register, login, user } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('detective');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Login Specific
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // FAQ Accordion
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dossierCardRef = useRef<HTMLDivElement>(null);

  // Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 25;

    let label = 'Weak';
    let color = 'bg-red-500';
    let text = 'text-red-400';
    if (score >= 75) {
      label = 'Cyber-Shielded';
      color = 'bg-emerald-500';
      text = 'text-emerald-400';
    } else if (score >= 50) {
      label = 'Strong';
      color = 'bg-amber-400';
      text = 'text-amber-400';
    } else if (score >= 25) {
      label = 'Moderate';
      color = 'bg-yellow-500';
      text = 'text-yellow-400';
    }
    return { score, label, color, text };
  };

  const pwdStrength = getPasswordStrength(password);

  // GSAP Scroll Animations
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Entrance for hero section
      gsap.fromTo(
        '.reg-hero-fade',
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' }
      );

      // Scroll triggers for animated sections
      const sections = document.querySelectorAll('.reg-scroll-section');
      sections.forEach((sec) => {
        gsap.fromTo(
          sec,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 3D Tilt on Dossier Preview Card
  const handleDossierMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = dossierCardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -8;
    const tiltY = (x / (rect.width / 2)) * 8;
    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleDossierMouseLeave = () => {
    const card = dossierCardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  // Submission Handlers
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required credentials.');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Security passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playClick();
      await register(username.trim(), email.trim(), password, selectedAvatar);
      sounds.playVictory();
      setSuccessMessage('Welcome to Suspecto!');
      setTimeout(() => {
        if (onSuccessRedirect) onSuccessRedirect();
        else onBackToHome();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your identifier and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playClick();
      await login(loginIdentifier.trim(), loginPassword);
      sounds.playVictory();
      setSuccessMessage('Signed in! Loading your profile...');
      setTimeout(() => {
        if (onSuccessRedirect) onSuccessRedirect();
        else onBackToHome();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#08090E] text-[#E6E8EC] relative overflow-x-hidden selection:bg-[#FFB800] selection:text-[#08090E]"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] bg-amber-500/10 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full blur-[150px] bg-purple-600/10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/3 w-[600px] h-[600px] rounded-full blur-[180px] bg-cyan-600/5 pointer-events-none" />

      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#08090E]/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500 hidden sm:inline">
            {mode === 'register' ? 'Already have an account?' : 'New here?'}
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              setMode(mode === 'register' ? 'login' : 'register');
              setErrorMessage(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/25 transition-all cursor-pointer"
          >
            {mode === 'register' ? 'Sign In →' : 'Register Free →'}
          </button>
        </div>
      </header>

      {/* MAIN HERO & REGISTRATION WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Hero text & profile preview card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="reg-hero-fade">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider mb-4">
                <Sparkles size={13} />
                <span>FREE TO PLAY</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {mode === 'register' ? (
                  <>
                    Create your account. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                      Draw. Bluff. Expose.
                    </span>
                  </>
                ) : (
                  <>
                    Welcome back. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                      Ready to play?
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-lg">
                One secret word. One hidden imposter. Take turns drawing on a shared canvas,
                then vote to expose the liar — with real-time voice chat and match history.
              </p>
            </div>

            {/* Profile preview card with 3D mouse-tilt */}
            <div
              ref={dossierCardRef}
              onMouseMove={handleDossierMouseMove}
              onMouseLeave={handleDossierMouseLeave}
              style={{ transition: 'transform 0.15s ease-out, box-shadow 0.3s ease' }}
              className="reg-hero-fade relative rounded-2xl p-6 bg-gradient-to-br from-[#12131C] to-[#0A0B10] border border-amber-500/30 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,166,35,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-400" />
                  <span className="font-mono text-xs font-bold text-zinc-400 tracking-widest uppercase">
                    PROFILE PREVIEW
                  </span>
                </div>
                <span className="font-mono text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  NEW PLAYER
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <AvatarDisplay avatarId={selectedAvatar} size="xl" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0A0B10]" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-white truncate">
                    {username.trim() || 'Agent Anonymous'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-zinc-400">
                    <span className="capitalize text-amber-300">
                      {selectedAvatar}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-500">#{Math.abs((username.length * 3791) % 9000 + 1000)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center font-mono">
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block uppercase">Play Style</span>
                  <span className="text-xs font-bold text-amber-300">Tactician</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block uppercase">Rank</span>
                  <span className="text-xs font-bold text-white">Cadet</span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] text-zinc-500 block uppercase">Voice</span>
                  <span className="text-xs font-bold text-emerald-400">Ready</span>
                </div>
              </div>
            </div>

            {/* Quick Benefits Pills */}
            <div className="reg-hero-fade grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                <span className="text-zinc-300 font-medium">Free forever, no pay-to-win</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                <span className="text-zinc-300 font-medium">Instant room matchmaking</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: The Clean, Modern Authentication Card */}
          <div className="lg:col-span-6">
            <div className="reg-hero-fade relative rounded-2xl p-6 sm:p-8 bg-[#111218]/90 border border-white/15 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              {/* Card Mode Tabs */}
              <div className="flex rounded-xl bg-black/50 p-1 border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-display text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 rounded-lg font-display text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Alert Notification */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span className="flex-1 font-medium">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="flex-1 font-medium">{successMessage}</span>
                </div>
              )}

              {/* FORM: REGISTRATION */}
              {mode === 'register' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Avatar Selector Grid */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Choose your avatar
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10">
                      {AVATAR_LIST.map((av) => {
                        const isSelected = selectedAvatar === av.id;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedAvatar(av.id);
                            }}
                            className={`p-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/25 ring-2 ring-amber-400 scale-105 shadow-md'
                                : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                            }`}
                            title={av.name}
                          >
                            <AvatarDisplay avatarId={av.id} size="sm" showBorder={false} />
                            <span className="text-[9px] font-mono text-zinc-400 mt-1 truncate max-w-full">
                              {av.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. CipherPhantom"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="agent@suspecto.app"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password & Security Meter */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        required
                        className="w-full pl-10 pr-10 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                      <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-500">Strength:</span>
                          <span className={`font-bold ${pwdStrength.text}`}>
                            {pwdStrength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pwdStrength.color} transition-all duration-300`}
                            style={{ width: `${pwdStrength.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Terms agreement */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-zinc-400 select-none">
                      I agree to Suspecto's fair-play rules and community guidelines.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !acceptedTerms}
                    className="w-full py-3.5 px-6 rounded-xl font-display font-black text-sm text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30 hover:shadow-[0_0_25px_rgba(245,166,35,0.4)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Creating account...</span>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* FORM: LOGIN */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Enter username or email..."
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password..."
                        required
                        className="w-full pl-10 pr-10 py-3 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-display font-black text-sm text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-900/30 hover:shadow-[0_0_25px_rgba(245,166,35,0.4)] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Signing in...</span>
                    ) : (
                      <>
                        <Shield size={16} />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* SCROLLING SECTION 1: GAMEPLAY VIDEO */}
        <section className="reg-scroll-section mt-20 sm:mt-28">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
              <Video size={13} />
              <span>GAMEPLAY DEMO</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
              Watch Suspecto In Action
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              See how a full match plays out — blind sketching, live voice discussion, and the final vote.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <GameplayVideoPlayer />
          </div>
        </section>

        {/* SCROLLING SECTION 2: GAME PHASES */}
        <section className="reg-scroll-section mt-20 sm:mt-28">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
              How Each Round Works
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Three phases, one hidden imposter, and a shared canvas.
            </p>
          </div>

          <GameplayPhotoGallery />
        </section>

        {/* SCROLLING SECTION 3: WHAT YOU GET */}
        <section className="reg-scroll-section mt-20 sm:mt-28">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
              WHAT YOU GET
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why make an account?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl bg-[#111116] border border-white/10 hover:border-amber-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                <Palette size={22} />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">
                Custom Drawing Tools
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unlock exclusive brush styles, custom line textures, and high-contrast color palettes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111116] border border-white/10 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4">
                <Radio size={22} />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">
                Private Voice Rooms
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Host private rooms with spatial audio, push-to-talk, and moderator controls.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111116] border border-white/10 hover:border-purple-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                <Layers size={22} />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">
                Match History
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Review every past game, download match artwork as PNG, and track your win rates over time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111116] border border-white/10 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <Award size={22} />
              </div>
              <h4 className="font-display font-bold text-lg text-white mb-2">
                Rank Progression
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Climb 20 tiers from Cadet to Master Detective, earning profile badges along the way.
              </p>
            </div>
          </div>
        </section>

        {/* SCROLLING SECTION 4: FAQ */}
        <section className="reg-scroll-section mt-20 sm:mt-28 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
              FAQ
            </span>
            <h2 className="font-display text-3xl font-black text-white tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'Do I need drawing skills to play and win?',
                a: 'Not at all! Suspecto is a social deduction game first. Simple, clever clues often win games over intricate drawings. Even as the Imposter, copying general line patterns is often enough to survive.',
              },
              {
                q: 'Can I play with friends on mobile and desktop simultaneously?',
                a: 'Yes! Suspecto runs seamlessly in any web browser across iPhones, Androids, iPads, Windows PCs, and Macs with real-time websocket synchronization.',
              },
              {
                q: 'How does the Imposter final guess work?',
                a: 'If the Imposter is indicted by the tribunal, they get one high-stakes 15-second window to enter the secret word. If they guess correctly, victory is stolen for the Imposter team!',
              },
              {
                q: 'Is voice chat mandatory?',
                a: 'No. Voice chat is optional. You can also deliberate through the in-game encrypted chat drawer using text, emojis, and deduction arguments.',
              },
            ].map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-[#111116] border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setExpandedFaq(isExpanded ? null : idx);
                    }}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-display font-bold text-sm sm:text-base text-white hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-zinc-500 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SCROLLING SECTION 5: BOTTOM CTA */}
        <section className="reg-scroll-section mt-20 sm:mt-28 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <h2 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Ready to play?
          </h2>
          <p className="text-sm text-zinc-300 max-w-xl mx-auto mb-6">
            Create a free account and jump into a live room in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                sounds.playClick();
              }}
              className="py-3.5 px-8 rounded-xl font-display font-black text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-900/30 cursor-pointer transition-all active:scale-95"
            >
              Sign up — it's free ↑
            </button>
            <button
              onClick={onBackToHome}
              className="py-3.5 px-6 rounded-xl font-display font-bold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer"
            >
              Browse Lobbies
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 py-8 px-4 text-center text-xs font-mono text-zinc-500">
        <p>Suspecto — Real-time multiplayer drawing & deduction.</p>
        <p className="mt-1 text-zinc-400">Developed with passion by Arham Ahmad Khan.</p>
      </footer>
    </div>
  );
};
