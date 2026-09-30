import { UserProfile, RoomSettings, MatchHistoryEntry } from '../types/game.js';

const TOKEN_KEY = 'gti_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async register(username: string, email: string, password: string, avatar?: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, avatar }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    this.setToken(data.token);
    return data;
  },

  async login(emailOrUsername: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) return null;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      this.setToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  },

  async updateProfile(updates: { username?: string; avatar?: string }): Promise<UserProfile> {
    const token = this.getToken();
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data.user;
  },

  async forgotPassword(email: string): Promise<{ resetToken: string; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Reset failed');
    return data;
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {}
    }
    this.setToken(null);
  },

  async createRoom(params: {
    hostPlayerId: string;
    hostUsername: string;
    hostAvatar: string;
    hostUserId?: string | null;
    settings?: Partial<RoomSettings>;
  }): Promise<{ roomId: string; roomCode: string }> {
    const token = this.getToken();
    const res = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create room');
    return data;
  },

  async getRoomInfo(idOrCode: string): Promise<{ roomId: string; roomCode: string; playersCount: number; maxPlayers: number; phase: string }> {
    const res = await fetch(`/api/rooms/${encodeURIComponent(idOrCode)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Room not found');
    return data;
  },

  async getMatchHistory(): Promise<MatchHistoryEntry[]> {
    const res = await fetch('/api/match-history');
    const data = await res.json();
    return data.matches || [];
  },
};
