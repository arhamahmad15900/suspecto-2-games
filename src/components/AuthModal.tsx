import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { AVATAR_LIST } from '../utils/avatars.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { Logo } from './Logo.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  message?: string | null;
  onSuccess?: () => void;
  onOpenFullRegister?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  message,
  onSuccess,
  onOpenFullRegister,
}) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialTab);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('detective');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(identifier, password);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !email.trim() || !password) {
      setError('Please complete all required fields.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(username, email, password, selectedAvatar);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please provide your account email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.forgotPassword(email);
      setSuccess(`Reset token issued: ${res.resetToken}`);
      setResetToken(res.resetToken);
      setTab('reset');
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetToken.trim() || !newPassword) {
      setError('Please fill in the token and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.resetPassword(resetToken, newPassword);
      setSuccess('Your password has been reset! Please log in.');
      setTab('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1217]/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#181C24] border border-[#28303F] rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-2 text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Notice Message if redirected because of auth gate */}
        {message && (
          <div className="mb-5 p-3 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/25 flex items-start gap-2.5 text-xs text-[#FFB800]">
            <Lock size={16} className="shrink-0 text-[#FFB800] mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{message}</div>
          </div>
        )}

        {/* Modal Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <Logo size="sm" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#E6E8EC]">
            {tab === 'login' && 'Sign In to Suspecto'}
            {tab === 'register' && 'Create Suspecto Account'}
            {tab === 'forgot' && 'Reset Password'}
            {tab === 'reset' && 'Set New Password'}
          </h2>
          <p className="text-xs text-[#9AA0AD] mt-1">
            {tab === 'login' && 'Log in to host rooms, join games, and track career stats.'}
            {tab === 'register' && 'Create your account to host rooms and play in real-time matches.'}
            {tab === 'forgot' && 'Enter your email to receive a password recovery token.'}
            {tab === 'reset' && 'Enter your reset token and your new secure password.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {(tab === 'login' || tab === 'register') && (
          <div className="grid grid-cols-2 p-1 mb-6 bg-[#0F1217] rounded-xl border border-[#28303F]">
            <button
              onClick={() => { setTab('login'); resetForm(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-[#202632] text-[#E6E8EC] border border-[#28303F] shadow-sm'
                  : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); resetForm(); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-[#202632] text-[#E6E8EC] border border-[#28303F] shadow-sm'
                  : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#E63946]/10 border border-[#E63946]/30 flex items-start gap-2.5 text-xs text-[#E63946]">
            <AlertCircle size={16} className="shrink-0 text-[#E63946] mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7B8290]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DetectiveHolmes"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#9AA0AD]">Password</label>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); resetForm(); }}
                  className="text-xs text-[#FFB800] hover:text-[#FFC425] transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7B8290]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7B8290] hover:text-[#E6E8EC] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm mt-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1">
                Choose Player Avatar
              </label>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {AVATAR_LIST.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`p-1 rounded-xl transition-all cursor-pointer ${
                      selectedAvatar === av.id
                        ? 'ring-2 ring-[#FFB800] scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <AvatarDisplay avatarId={av.id} size="sm" showBorder={false} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7B8290]">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Unique display name"
                  maxLength={20}
                  className="w-full pl-9 pr-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7B8290]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-[#9AA0AD] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ chars"
                  className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9AA0AD] mb-1">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter"
                  className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm mt-1"
            >
              {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
            </button>

            {onOpenFullRegister && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullRegister();
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors cursor-pointer"
                >
                  ⚡ Open Full Showcase & Registration Page →
                </button>
              </div>
            )}
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7B8290]">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your account email"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Requesting...' : 'Generate Reset Token'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setTab('login'); resetForm(); }}
                className="text-xs text-[#9AA0AD] hover:text-[#E6E8EC] transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {tab === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1.5">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Token e.g. rst_abc123"
                className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA0AD] mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 bg-[#0F1217] border border-[#28303F] rounded-xl text-sm text-[#E6E8EC] placeholder:text-[#5A6170] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#FFB800] hover:bg-[#FFC425] disabled:opacity-50 text-[#0F1217] font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              {isSubmitting ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
