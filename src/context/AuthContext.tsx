import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/game.js';
import { api } from '../services/api.js';

interface GuestProfile {
  id: string;
  username: string;
  avatar: string;
}

interface AuthContextType {
  user: UserProfile | null;
  guest: GuestProfile;
  effectiveProfile: { id: string; username: string; avatar: string; isRegistered: boolean };
  isLoading: boolean;
  login: (emailOrUser: string, pass: string) => Promise<void>;
  register: (user: string, email: string, pass: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: { username?: string; avatar?: string }) => Promise<void>;
  setGuestNickname: (name: string) => void;
  setGuestAvatar: (avatar: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_AVATARS = ['detective', 'artist', 'ninja', 'cyber', 'owl', 'fox', 'alien', 'cat'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guest state stored in localStorage
  const [guest, setGuest] = useState<GuestProfile>(() => {
    const saved = localStorage.getItem('suspecto_guest');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    const randId = 'gst_' + Math.random().toString(36).substring(2, 9);
    const randNum = Math.floor(100 + Math.random() * 900);
    const initial: GuestProfile = {
      id: randId,
      username: `Player_${randNum}`,
      avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
    };
    localStorage.setItem('suspecto_guest', JSON.stringify(initial));
    return initial;
  });

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch (_) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (emailOrUser: string, pass: string) => {
    const res = await api.login(emailOrUser, pass);
    setUser(res.user);
  };

  const register = async (username: string, email: string, pass: string, avatar?: string) => {
    const res = await api.register(username, email, pass, avatar);
    setUser(res.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const updateProfile = async (updates: { username?: string; avatar?: string }) => {
    if (user) {
      const updated = await api.updateProfile(updates);
      setUser(updated);
    } else {
      setGuest(prev => {
        const next = {
          ...prev,
          username: updates.username || prev.username,
          avatar: updates.avatar || prev.avatar,
        };
        localStorage.setItem('suspecto_guest', JSON.stringify(next));
        return next;
      });
    }
  };

  const setGuestNickname = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setGuest(prev => {
      const next = { ...prev, username: clean };
      localStorage.setItem('suspecto_guest', JSON.stringify(next));
      return next;
    });
  };

  const setGuestAvatar = (avatar: string) => {
    setGuest(prev => {
      const next = { ...prev, avatar };
      localStorage.setItem('suspecto_guest', JSON.stringify(next));
      return next;
    });
  };

  const effectiveProfile = {
    id: user ? user.id : guest.id,
    username: user ? user.username : guest.username,
    avatar: user ? user.avatar : guest.avatar,
    isRegistered: !!user,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        guest,
        effectiveProfile,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        setGuestNickname,
        setGuestAvatar,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
