/**
 * SketchioManager — server-side game engine for Sketchio.
 *
 * Phase flow:
 *   LOBBY → (host starts) → WORD_SELECT (10s) → DRAWING (N s) → ROUND_RESULTS (5s)
 *        → next turn (back to WORD_SELECT) ... → GAME_OVER
 *
 * Scoring (Skribbl.io style):
 *   - Guesser: 500 − floor(450 × timeElapsed / totalTime)  (min 50)
 *   - Drawer:  +25 per correct guesser (max 150)
 *   - Speed bonus: first guesser +50 extra
 */

import { WebSocket } from 'ws';
import crypto from 'crypto';
import {
  DrawingStroke,
  SketchioPhase,
  SketchioSettings,
  SketchioPlayerInfo,
  SketchioRoomState,
  SketchioPrivateInfo,
  SketchioChat,
  SketchioGuessEvent,
  SketchioRoundResult,
  SketchioServerMessage,
} from '../src/types/game.js';
import { getSketchioWordChoices, isSketchioGuessCorrect, isSketchioGuessClose } from '../src/utils/sketchioWords.js';
import { db } from './db.js';

/* ─── Internal types ────────────────────────────────────────── */

interface SKPlayer {
  id: string;
  userId: string | null;
  username: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  hasGuessedThisRound: boolean;
  guessTimeMs: number | null;
  ws?: WebSocket;
  disconnectTimeout?: NodeJS.Timeout;
}

interface SKRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  settings: SketchioSettings;
  phase: SketchioPhase;
  phaseDeadline: number | null;
  players: Map<string, SKPlayer>;

  currentRound: number;
  totalRounds: number;
  turnOrder: string[];
  currentTurnIndex: number;
  currentDrawerId: string | null;

  strokes: DrawingStroke[];
  chatMessages: SketchioChat[];
  guessEvents: SketchioGuessEvent[];

  wordChoices: string[];
  currentWord: string;
  hint: string;
  wordLength: number;
  roundStartTime: number;
  hintTimer: NodeJS.Timeout | null;
  hintRevealedCount: number;

  lastRoundResult: SketchioRoundResult | null;
  timer: NodeJS.Timeout | null;
  createdAt: number;
}

/* ─── Constants ─────────────────────────────────────────────── */
const WORD_SELECT_SECONDS = 15;
const ROUND_RESULTS_SECONDS = 5;
const MAX_SCORE_PER_GUESS = 500;
const MIN_SCORE_PER_GUESS = 50;
const DRAWER_POINTS_PER_GUESSER = 30;
const MAX_DRAWER_POINTS = 150;
const FIRST_GUESSER_BONUS = 50;
const DISCONNECT_GRACE_MS = 45_000;

/* ═══════════════════════════════════════════════════════════════
   SketchioManager
═══════════════════════════════════════════════════════════════ */
export class SketchioManager {
  private rooms = new Map<string, SKRoom>();
  private playerRoomMap = new Map<string, string>(); // playerId → roomId

  /* ── Room helpers ────────────────────────────────────────── */

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return this.rooms.has('SK_' + code) ? this.generateCode() : code;
  }

  private send(ws: WebSocket, msg: SketchioServerMessage) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  private broadcast(room: SKRoom, msg: SketchioServerMessage) {
    for (const p of room.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) this.send(p.ws, msg);
    }
  }

  private setTimer(room: SKRoom, seconds: number, cb: () => void) {
    this.clearTimer(room);
    room.phaseDeadline = Date.now() + seconds * 1000;
    room.timer = setTimeout(cb, seconds * 1000);
  }

  private clearTimer(room: SKRoom) {
    if (room.timer) { clearTimeout(room.timer); room.timer = null; }
    room.phaseDeadline = null;
  }

  private clearHintTimer(room: SKRoom) {
    if (room.hintTimer) { clearTimeout(room.hintTimer); room.hintTimer = null; }
  }

  /* ── Build public state / private info ───────────────────── */

  private publicState(room: SKRoom): SketchioRoomState {
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      phase: room.phase,
      phaseDeadline: room.phaseDeadline,
      settings: { ...room.settings },
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        isHost: p.isHost,
        isConnected: p.isConnected,
        score: p.score,
        hasGuessedThisRound: p.hasGuessedThisRound,
        guessTimeMs: p.guessTimeMs,
      }) satisfies SketchioPlayerInfo),
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      currentDrawerId: room.currentDrawerId,
      turnOrder: [...room.turnOrder],
      currentTurnIndex: room.currentTurnIndex,
      strokes: room.strokes,
      hint: room.hint,
      wordLength: room.wordLength,
      chatMessages: room.chatMessages.slice(-80),
      guessEvents: room.guessEvents,
      lastRoundResult: room.lastRoundResult,
      createdAt: room.createdAt,
    };
  }

  private privateInfo(room: SKRoom, playerId: string): SketchioPrivateInfo {
    const isDrawer = room.currentDrawerId === playerId;
    return {
      playerId,
      isDrawer,
      // Drawer gets the word once it's chosen; guessers never see it
      currentWord: isDrawer && room.currentWord ? room.currentWord : null,
      // During WORD_SELECT, drawer sees the choices
      wordChoices: (room.phase === 'WORD_SELECT' && isDrawer) ? room.wordChoices : null,
    };
  }

  /** Send full sync to all players (with individual private info) */
  public syncAll(room: SKRoom) {
    const state = this.publicState(room);
    for (const p of room.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        this.send(p.ws, { type: 'sk_sync', state, privateInfo: this.privateInfo(room, p.id) });
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API (called from server.ts)
  ═══════════════════════════════════════════════════════════ */

  public createRoom(
    hostPlayerId: string,
    hostUsername: string,
    hostAvatar: string,
    hostUserId: string | null,
    settings: Partial<SketchioSettings> = {}
  ): { roomId: string; roomCode: string } {
    const roomId = 'sk_room_' + crypto.randomBytes(6).toString('hex');
    const roomCode = this.generateCode();

    const merged: SketchioSettings = {
      maxPlayers: Math.min(12, Math.max(2, settings.maxPlayers ?? 8)),
      drawingTimeSeconds: Math.min(180, Math.max(30, settings.drawingTimeSeconds ?? 80)),
      rounds: Math.min(8, Math.max(1, settings.rounds ?? 3)),
      wordChoices: 3,
      hintInterval: settings.hintInterval ?? 20,
      isPrivate: settings.isPrivate ?? true,
    };

    const host: SKPlayer = {
      id: hostPlayerId,
      userId: hostUserId,
      username: hostUsername,
      avatar: hostAvatar,
      isHost: true,
      isConnected: true,
      score: 0,
      hasGuessedThisRound: false,
      guessTimeMs: null,
    };

    const room: SKRoom = {
      roomId,
      roomCode,
      hostId: hostPlayerId,
      settings: merged,
      phase: 'LOBBY',
      phaseDeadline: null,
      players: new Map([[hostPlayerId, host]]),
      currentRound: 1,
      totalRounds: merged.rounds,
      turnOrder: [],
      currentTurnIndex: 0,
      currentDrawerId: null,
      strokes: [],
      chatMessages: [],
      guessEvents: [],
      wordChoices: [],
      currentWord: '',
      hint: '',
      wordLength: 0,
      roundStartTime: 0,
      hintTimer: null,
      hintRevealedCount: 0,
      lastRoundResult: null,
      timer: null,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.rooms.set('SK_' + roomCode, room);
    this.playerRoomMap.set(hostPlayerId, roomId);

    return { roomId, roomCode };
  }

  public getRoom(idOrCode: string): SKRoom | null {
    return this.rooms.get(idOrCode) ?? this.rooms.get('SK_' + idOrCode.toUpperCase()) ?? null;
  }

  public joinRoom(
    idOrCode: string,
    playerInfo: { id: string; username: string; avatar: string; userId: string | null },
    ws: WebSocket
  ): SKRoom {
    const room = this.getRoom(idOrCode);
    if (!room) throw new Error('Room not found.');

    let player = room.players.get(playerInfo.id);

    if (player) {
      // Reconnect
      if (player.disconnectTimeout) { clearTimeout(player.disconnectTimeout); player.disconnectTimeout = undefined; }
      player.isConnected = true;
      player.ws = ws;
    } else {
      if (room.players.size >= room.settings.maxPlayers) throw new Error('Room is full.');
      if (room.phase !== 'LOBBY') throw new Error('Game already in progress.');

      player = {
        id: playerInfo.id,
        userId: playerInfo.userId,
        username: playerInfo.username,
        avatar: playerInfo.avatar,
        isHost: false,
        isConnected: true,
        score: 0,
        hasGuessedThisRound: false,
        guessTimeMs: null,
        ws,
      };
      room.players.set(playerInfo.id, player);
      this.playerRoomMap.set(playerInfo.id, room.roomId);
    }

    return room;
  }

  public leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;

    player.isConnected = false;
    player.ws = undefined;

    player.disconnectTimeout = setTimeout(() => {
      if (room.phase === 'LOBBY') {
        room.players.delete(playerId);
        this.playerRoomMap.delete(playerId);
        // Reassign host
        if (playerId === room.hostId) {
          const next = [...room.players.values()].find(p => p.isConnected);
          if (next) { next.isHost = true; room.hostId = next.id; }
          else { this.closeRoom(room); return; }
        }
      }
      // In-game: keep ghost slot so scores persist
      this.syncAll(room);
    }, DISCONNECT_GRACE_MS);

    this.syncAll(room);
  }

  public handleDisconnect(playerId: string) {
    const roomId = this.playerRoomMap.get(playerId);
    if (roomId) this.leaveRoom(roomId, playerId);
  }

  private closeRoom(room: SKRoom) {
    this.clearTimer(room);
    this.clearHintTimer(room);
    this.broadcast(room, { type: 'sk_room_closed', reason: 'Room closed — all players left.' });
    this.rooms.delete(room.roomId);
    this.rooms.delete('SK_' + room.roomCode);
    for (const p of room.players.keys()) this.playerRoomMap.delete(p);
  }

  /* ── Host actions ────────────────────────────────────────── */

  public startGame(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    if (room.players.get(hostPlayerId)?.isHost !== true) throw new Error('Only the host can start.');
    const connected = [...room.players.values()].filter(p => p.isConnected);
    if (connected.length < 2) throw new Error('Need at least 2 players to start.');

    // Reset scores
    for (const p of room.players.values()) { p.score = 0; p.hasGuessedThisRound = false; p.guessTimeMs = null; }
    room.currentRound = 1;
    room.totalRounds = room.settings.rounds;
    room.strokes = [];
    room.chatMessages = [];
    room.lastRoundResult = null;

    // Build turn order: all connected players, shuffled
    room.turnOrder = connected.map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;

    this.startWordSelect(room);
  }

  public restartGame(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.players.get(hostPlayerId)?.isHost !== true) return;
    this.clearTimer(room);
    this.clearHintTimer(room);
    for (const p of room.players.values()) { p.score = 0; p.hasGuessedThisRound = false; p.guessTimeMs = null; }
    room.phase = 'LOBBY';
    room.strokes = [];
    room.chatMessages = [];
    room.guessEvents = [];
    room.lastRoundResult = null;
    room.currentWord = '';
    room.hint = '';
    room.wordLength = 0;
    room.currentDrawerId = null;
    room.currentRound = 1;
    room.phaseDeadline = null;
    this.syncAll(room);
  }

  public kickPlayer(roomId: string, hostPlayerId: string, targetId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    if (room.players.get(hostPlayerId)?.isHost !== true) return;
    const target = room.players.get(targetId);
    if (!target || targetId === hostPlayerId) return;
    if (target.ws) this.send(target.ws, { type: 'sk_room_closed', reason: 'You were removed by the host.' });
    room.players.delete(targetId);
    this.playerRoomMap.delete(targetId);
    this.syncAll(room);
  }

  public updateSettings(roomId: string, hostPlayerId: string, settings: Partial<SketchioSettings>) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'LOBBY') return;
    if (room.players.get(hostPlayerId)?.isHost !== true) return;
    if (settings.maxPlayers !== undefined) room.settings.maxPlayers = Math.min(12, Math.max(2, settings.maxPlayers));
    if (settings.drawingTimeSeconds !== undefined) room.settings.drawingTimeSeconds = Math.min(180, Math.max(30, settings.drawingTimeSeconds));
    if (settings.rounds !== undefined) room.settings.rounds = Math.min(8, Math.max(1, settings.rounds));
    if (settings.isPrivate !== undefined) room.settings.isPrivate = settings.isPrivate;
    this.syncAll(room);
  }

  /* ── Phase transitions ───────────────────────────────────── */

  private startWordSelect(room: SKRoom) {
    // Guard: skip disconnected drawers
    while (room.currentTurnIndex < room.turnOrder.length) {
      const drawerId = room.turnOrder[room.currentTurnIndex];
      const drawer = room.players.get(drawerId);
      if (drawer?.isConnected) break;
      room.currentTurnIndex++;
    }

    if (room.currentTurnIndex >= room.turnOrder.length) {
      // This round's turns are exhausted
      if (room.currentRound < room.totalRounds) {
        room.currentRound++;
        const connected = [...room.players.values()].filter(p => p.isConnected);
        room.turnOrder = connected.map(p => p.id).sort(() => Math.random() - 0.5);
        room.currentTurnIndex = 0;
        this.startWordSelect(room);
        return;
      } else {
        this.endGame(room);
        return;
      }
    }

    const drawerId = room.turnOrder[room.currentTurnIndex];
    room.currentDrawerId = drawerId;
    room.phase = 'WORD_SELECT';
    room.strokes = [];
    room.guessEvents = [];

    // Reset guess state for all players
    for (const p of room.players.values()) {
      p.hasGuessedThisRound = false;
      p.guessTimeMs = null;
    }

    // Pick word choices for this drawer
    const choices = getSketchioWordChoices(room.settings.wordChoices);
    room.wordChoices = choices.map(c => c.word);
    room.currentWord = '';
    room.hint = '';
    room.wordLength = 0;

    this.setTimer(room, WORD_SELECT_SECONDS, () => {
      // Auto-pick first word if drawer didn't choose
      if (!room.currentWord) {
        room.currentWord = room.wordChoices[0] || 'apple';
        this.startDrawing(room);
      }
    });

    this.syncAll(room);
  }

  public selectWord(roomId: string, playerId: string, word: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'WORD_SELECT') return;
    if (room.currentDrawerId !== playerId) return;
    if (!room.wordChoices.includes(word)) return;

    this.clearTimer(room);
    room.currentWord = word;
    this.startDrawing(room);
  }

  private startDrawing(room: SKRoom) {
    room.phase = 'DRAWING';
    room.roundStartTime = Date.now();
    room.hintRevealedCount = 0;
    room.hint = room.currentWord.split('').map(ch => (ch === ' ' ? ' ' : '_')).join(' ');
    room.wordLength = room.currentWord.length;
    room.strokes = [];

    this.setTimer(room, room.settings.drawingTimeSeconds, () => {
      this.endRound(room);
    });

    // Schedule progressive hints
    this.scheduleHints(room);

    // Post system chat announcing it's drawing time
    this.pushSystemChat(room, `✏️ ${room.players.get(room.currentDrawerId!)?.username ?? 'Someone'} is drawing! Guess the word!`);

    this.syncAll(room);
  }

  private scheduleHints(room: SKRoom) {
    this.clearHintTimer(room);
    const interval = room.settings.hintInterval * 1000;
    const wordChars = room.currentWord.replace(/ /g, '');
    const maxHints = Math.max(1, Math.floor(wordChars.length / 2));

    const revealNextHint = () => {
      if (room.phase !== 'DRAWING') return;
      if (room.hintRevealedCount >= maxHints) return;

      // Find a hidden position and reveal it
      const hiddenPositions: number[] = [];
      let charIdx = 0;
      for (let i = 0; i < room.currentWord.length; i++) {
        if (room.currentWord[i] !== ' ') {
          const hintPart = room.hint.split(' ');
          // hint is "_ _ a _ _" style — map real char index to hint char index
          if (hintPart[i] === '_') hiddenPositions.push(i);
          charIdx++;
        }
      }

      if (hiddenPositions.length === 0) return;
      const reveal = hiddenPositions[Math.floor(Math.random() * hiddenPositions.length)];
      const hintArr = room.hint.split(' ');
      hintArr[reveal] = room.currentWord[reveal];
      room.hint = hintArr.join(' ');
      room.hintRevealedCount++;

      this.broadcast(room, { type: 'sk_hint', hint: room.hint });

      if (room.hintRevealedCount < maxHints) {
        room.hintTimer = setTimeout(revealNextHint, interval);
      }
    };

    room.hintTimer = setTimeout(revealNextHint, interval);
  }

  /* ── Guess handling ──────────────────────────────────────── */

  public submitGuess(roomId: string, playerId: string, text: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;

    const player = room.players.get(playerId);
    if (!player) return;

    // Drawer cannot guess their own word
    if (room.currentDrawerId === playerId) return;

    // Already guessed correctly this round
    if (player.hasGuessedThisRound) {
      // Still relay message to others who haven't guessed (but obscure hint)
      this.relayObscuredChat(room, player, text);
      return;
    }

    const correct = isSketchioGuessCorrect(text, room.currentWord);

    if (correct) {
      const elapsedMs = Date.now() - room.roundStartTime;
      const totalMs = room.settings.drawingTimeSeconds * 1000;
      const fraction = Math.min(1, elapsedMs / totalMs);
      const isFirstGuesser = room.guessEvents.length === 0;

      // Score for guesser
      let points = Math.max(MIN_SCORE_PER_GUESS,
        Math.round(MAX_SCORE_PER_GUESS - (MAX_SCORE_PER_GUESS - MIN_SCORE_PER_GUESS) * fraction));
      if (isFirstGuesser) points += FIRST_GUESSER_BONUS;

      player.score += points;
      player.hasGuessedThisRound = true;
      player.guessTimeMs = elapsedMs;

      // Score for drawer
      const drawer = room.players.get(room.currentDrawerId!);
      if (drawer) {
        const drawerBonus = Math.min(MAX_DRAWER_POINTS, DRAWER_POINTS_PER_GUESSER);
        drawer.score += drawerBonus;
      }

      room.guessEvents.push({
        playerId,
        playerName: player.username,
        playerAvatar: player.avatar,
        text: room.currentWord,
        isCorrect: true,
        pointsEarned: points,
        timestamp: Date.now(),
        guessTimeMs: elapsedMs,
      });

      // System chat: "PlayerX guessed correctly! (+NNN pts)"
      this.pushSystemChat(room, `✅ ${player.username} guessed the word! (+${points} pts)`);

      // Notify all about correct guess
      this.broadcast(room, {
        type: 'sk_correct_guess',
        playerId,
        playerName: player.username,
        points,
      });

      // Check if everyone has guessed
      const guessers = [...room.players.values()].filter(
        p => p.id !== room.currentDrawerId && p.isConnected && !p.hasGuessedThisRound
      );
      if (guessers.length === 0) {
        this.clearTimer(room);
        this.endRound(room);
        return;
      }

      this.syncAll(room);
    } else {
      // Wrong guess — post to chat for everyone
      const chatMsg: SketchioChat = {
        id: 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        senderId: playerId,
        senderName: player.username,
        senderAvatar: player.avatar,
        text,
        isCorrectGuess: false,
        isSystem: false,
        timestamp: Date.now(),
      };
      room.chatMessages.push(chatMsg);
      if (room.chatMessages.length > 100) room.chatMessages.shift();
      this.broadcast(room, { type: 'sk_chat', msg: chatMsg });

      if (player.ws && isSketchioGuessClose(text, room.currentWord)) {
        this.send(player.ws, { type: 'sk_close_guess', guess: text });
      }
    }
  }

  /** Chat from a player who already guessed — only visible to other correct guessers */
  private relayObscuredChat(room: SKRoom, player: SKPlayer, text: string) {
    const msg: SketchioChat = {
      id: 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      senderId: player.id,
      senderName: player.username,
      senderAvatar: player.avatar,
      text,
      isCorrectGuess: false,
      isSystem: false,
      timestamp: Date.now(),
    };
    // Send only to drawer + players who've already guessed
    for (const p of room.players.values()) {
      if (p.ws && p.ws.readyState === WebSocket.OPEN) {
        if (p.id === room.currentDrawerId || p.hasGuessedThisRound || p.id === player.id) {
          this.send(p.ws, { type: 'sk_chat', msg });
        }
      }
    }
  }

  private pushSystemChat(room: SKRoom, text: string) {
    const msg: SketchioChat = {
      id: 'sys_' + Date.now(),
      senderId: 'system',
      senderName: 'Sketchio',
      senderAvatar: 'system',
      text,
      isCorrectGuess: false,
      isSystem: true,
      timestamp: Date.now(),
    };
    room.chatMessages.push(msg);
    this.broadcast(room, { type: 'sk_chat', msg });
  }

  /* ── Drawing relay ───────────────────────────────────────── */

  public addStroke(roomId: string, playerId: string, stroke: DrawingStroke) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    if (room.currentDrawerId !== playerId) return;
    room.strokes.push(stroke);
    this.broadcast(room, { type: 'sk_stroke', stroke });
  }

  public clearCanvas(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    if (room.currentDrawerId !== playerId) return;
    room.strokes = [];
    this.broadcast(room, { type: 'sk_clear' });
  }

  public undoStroke(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    if (room.currentDrawerId !== playerId) return;
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].playerId === playerId) {
        const removed = room.strokes.splice(i, 1)[0];
        this.broadcast(room, { type: 'sk_undo', strokeId: removed.id });
        break;
      }
    }
  }

  /* ── Round/game end ──────────────────────────────────────── */

  private endRound(room: SKRoom) {
    this.clearTimer(room);
    this.clearHintTimer(room);

    room.phase = 'ROUND_RESULTS';

    const correctGuessers = room.guessEvents.map(g => ({
      id: g.playerId,
      username: g.playerName,
      points: g.pointsEarned,
      timeMs: g.guessTimeMs ?? 0,
    }));

    const drawer = room.players.get(room.currentDrawerId!);
    const drawerPointsThisRound = correctGuessers.length > 0
      ? Math.min(MAX_DRAWER_POINTS, correctGuessers.length * DRAWER_POINTS_PER_GUESSER)
      : 0;

    const scores: Record<string, number> = {};
    for (const p of room.players.values()) scores[p.id] = p.score;

    room.lastRoundResult = {
      roundNumber: room.currentRound,
      drawerId: room.currentDrawerId!,
      drawerName: drawer?.username ?? 'Unknown',
      word: room.currentWord,
      correctGuessers,
      drawerPoints: drawerPointsThisRound,
      scores,
    };

    // Reveal the word in chat
    this.pushSystemChat(room, `🔤 The word was: "${room.currentWord}"`);

    this.setTimer(room, ROUND_RESULTS_SECONDS, () => {
      room.currentTurnIndex++;
      this.startWordSelect(room);
    });

    this.syncAll(room);
  }

  private endGame(room: SKRoom) {
    this.clearTimer(room);
    this.clearHintTimer(room);
    room.phase = 'GAME_OVER';
    room.currentDrawerId = null;
    this.pushSystemChat(room, '🏆 Game over! Final scores above.');

    // Record stats for registered players
    const players = [...room.players.values()];
    const maxScore = Math.max(...players.map(p => p.score));
    const statsUpdates = players
      .filter(p => p.userId)
      .map(p => ({
        userId: p.userId!,
        role: 'CREW' as const,
        won: p.score === maxScore,
        eliminated: false,
      }));

    if (statsUpdates.length > 0) {
      try {
        db.recordMatchOutcome(
          {
            id: 'sk_match_' + crypto.randomBytes(4).toString('hex'),
            roomId: room.roomId,
            timestamp: Date.now(),
            durationSeconds: 0,
            secretWord: '',
            category: 'Sketchio',
            winner: 'CREW',
            imposters: [],
            playersCount: players.length,
            eliminatedPlayers: [],
          },
          statsUpdates
        );
      } catch (_) { /* stats are non-critical */ }
    }

    this.syncAll(room);
  }
}

export const sketchioManager = new SketchioManager();
