import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, UserStats, MatchHistoryEntry } from '../src/types/game.js';

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  avatar: string;
  createdAt: number;
  stats: UserStats;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>; // userId -> StoredUser
  sessions: Record<string, string>;  // token -> userId
  matchHistory: MatchHistoryEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema = {
    users: {},
    sessions: {},
    matchHistory: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('[DB] Failed to load data, using defaults:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save database:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  public registerUser(username: string, email: string, password: string, avatar?: string): { user: UserProfile; token: string } {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate username
    const usernameExists = Object.values(this.data.users).some(
      u => u.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (usernameExists) {
      throw new Error('Username already taken. Please choose another.');
    }

    // Check duplicate email
    const emailExists = Object.values(this.data.users).some(
      u => u.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      throw new Error('Email address already registered.');
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPassword(password, salt);

    const defaultAvatars = ['detective', 'artist', 'ninja', 'cyber', 'owl', 'fox', 'alien', 'cat'];
    const chosenAvatar = avatar || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const storedUser: StoredUser = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      passwordSalt: salt,
      passwordHash: hash,
      avatar: chosenAvatar,
      createdAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        crewWins: 0,
        imposterWins: 0,
        timesImposter: 0,
        timesEliminated: 0,
      },
    };

    this.data.users[userId] = storedUser;
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    this.data.sessions[token] = userId;
    this.save();

    return {
      user: this.toProfile(storedUser),
      token,
    };
  }

  public loginUser(emailOrUsername: string, password: string): { user: UserProfile; token: string } {
    const term = emailOrUsername.trim().toLowerCase();
    const storedUser = Object.values(this.data.users).find(
      u => u.email.toLowerCase() === term || u.username.toLowerCase() === term
    );

    if (!storedUser) {
      throw new Error('Invalid username/email or password.');
    }

    const testHash = this.hashPassword(password, storedUser.passwordSalt);
    if (testHash !== storedUser.passwordHash) {
      throw new Error('Invalid username/email or password.');
    }

    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    this.data.sessions[token] = storedUser.id;
    this.save();

    return {
      user: this.toProfile(storedUser),
      token,
    };
  }

  public getUserByToken(token: string): UserProfile | null {
    if (!token) return null;
    const userId = this.data.sessions[token];
    if (!userId) return null;
    const user = this.data.users[userId];
    return user ? this.toProfile(user) : null;
  }

  public logoutUser(token: string) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
    }
  }

  public updateProfile(userId: string, updates: { username?: string; avatar?: string }): UserProfile {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found.');

    if (updates.username && updates.username.trim() !== user.username) {
      const cleanUsername = updates.username.trim();
      const exists = Object.values(this.data.users).some(
        u => u.id !== userId && u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (exists) {
        throw new Error('Username already taken.');
      }
      user.username = cleanUsername;
    }

    if (updates.avatar) {
      user.avatar = updates.avatar;
    }

    this.save();
    return this.toProfile(user);
  }

  public requestPasswordReset(email: string): { resetToken: string; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const user = Object.values(this.data.users).find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      // Return success message anyway for security privacy
      return { resetToken: 'mock_token', message: 'If that email exists in our records, a password reset code has been issued.' };
    }
    const resetToken = 'rst_' + crypto.randomBytes(12).toString('hex');
    // Store temporarily
    this.data.sessions[resetToken] = user.id;
    this.save();
    return { resetToken, message: 'Password reset token generated successfully.' };
  }

  public resetPassword(token: string, newPassword: string): boolean {
    const userId = this.data.sessions[token];
    if (!userId) {
      throw new Error('Invalid or expired reset token.');
    }
    const user = this.data.users[userId];
    if (!user) {
      throw new Error('User not found.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = salt;
    user.passwordHash = this.hashPassword(newPassword, salt);
    delete this.data.sessions[token];
    this.save();
    return true;
  }

  public recordMatchOutcome(entry: MatchHistoryEntry, playerStatsUpdate: { userId: string; role: 'CREW' | 'IMPOSTER'; won: boolean; eliminated: boolean }[]) {
    this.data.matchHistory.unshift(entry);
    if (this.data.matchHistory.length > 50) {
      this.data.matchHistory.pop();
    }

    for (const p of playerStatsUpdate) {
      if (p.userId && this.data.users[p.userId]) {
        const u = this.data.users[p.userId];
        u.stats.gamesPlayed += 1;
        if (p.role === 'IMPOSTER') {
          u.stats.timesImposter += 1;
          if (p.won) u.stats.imposterWins += 1;
        } else {
          if (p.won) u.stats.crewWins += 1;
        }
        if (p.eliminated) {
          u.stats.timesEliminated += 1;
        }
      }
    }
    this.save();
  }

  public getMatchHistory(): MatchHistoryEntry[] {
    return this.data.matchHistory.slice(0, 20);
  }

  private toProfile(user: StoredUser): UserProfile {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: { ...user.stats },
    };
  }
}

export const db = new Database();
