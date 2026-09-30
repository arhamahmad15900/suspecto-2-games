/**
 * SketchioContext — client-side WebSocket state for Sketchio.
 * Mirrors the pattern of GameContext but is entirely independent.
 */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  DrawingStroke,
  SketchioRoomState,
  SketchioPrivateInfo,
  SketchioChat,
  SketchioClientMessage,
  SketchioServerMessage,
  SketchioSettings,
} from '../types/game.js';
import { useAuth } from './AuthContext.js';
import { sounds } from '../services/sound.js';

/* ─── API helpers (no dependency on main api.ts) ─── */
async function skCreateRoom(token: string, settings: Partial<SketchioSettings>): Promise<{ roomId: string; roomCode: string }> {
  const res = await fetch('/api/sketchio/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ settings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create room');
  return data;
}

async function skGetRoom(idOrCode: string): Promise<{ roomId: string; roomCode: string }> {
  const res = await fetch(`/api/sketchio/rooms/${idOrCode.trim().toUpperCase()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Room not found');
  return data;
}

function getToken(): string | null {
  return localStorage.getItem('gti_auth_token');
}

/* ─── Context shape ─── */
interface SketchioContextType {
  skRoomState: SketchioRoomState | null;
  skPrivateInfo: SketchioPrivateInfo | null;
  skStrokes: DrawingStroke[];
  skConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  skError: string | null;
  clearSkError: () => void;
  skTimeRemaining: number;
  skCloseGuess: string | null;

  // Actions
  skCreateAndJoin: (settings?: Partial<SketchioSettings>) => Promise<void>;
  skJoin: (idOrCode: string) => Promise<void>;
  skLeave: () => void;
  skStartGame: () => void;
  skSelectWord: (word: string) => void;
  skSendGuess: (text: string) => void;
  skSendStroke: (stroke: DrawingStroke) => void;
  skClearCanvas: () => void;
  skUndoStroke: () => void;
  skKickPlayer: (targetId: string) => void;
  skUpdateSettings: (s: Partial<SketchioSettings>) => void;
  skRestartGame: () => void;

  // Derived
  skAmIDrawer: boolean;
  skAmIHost: boolean;
  skMyPlayer: SketchioRoomState['players'][number] | null;
}

const SketchioContext = createContext<SketchioContextType | null>(null);

export const useSketchio = () => {
  const ctx = useContext(SketchioContext);
  if (!ctx) throw new Error('useSketchio must be used inside <SketchioProvider>');
  return ctx;
};

export const SketchioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, effectiveProfile } = useAuth();

  const [skRoomState, setSkRoomState]       = useState<SketchioRoomState | null>(null);
  const [skPrivateInfo, setSkPrivateInfo]   = useState<SketchioPrivateInfo | null>(null);
  const [skStrokes, setSkStrokes]           = useState<DrawingStroke[]>([]);
  const [skConnectionStatus, setSkConnStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [skError, setSkError]               = useState<string | null>(null);
  const [skTimeRemaining, setSkTimeRemaining] = useState(0);
  const [skCloseGuess, setSkCloseGuess] = useState<string | null>(null);

  const wsRef   = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!skCloseGuess) return;
    const t = setTimeout(() => setSkCloseGuess(null), 2800);
    return () => clearTimeout(t);
  }, [skCloseGuess]);

  const clearSkError = () => setSkError(null);

  /* ── send helper ─────────────────────────────────────────── */
  const send = useCallback((msg: SketchioClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  /* ── countdown ───────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      if (!skRoomState?.phaseDeadline) { setSkTimeRemaining(0); return; }
      const diff = Math.max(0, Math.round((skRoomState.phaseDeadline - Date.now()) / 1000));
      setSkTimeRemaining(diff);
      if (diff > 0 && diff <= 5) sounds.playTick();
    }, 250);
    return () => clearInterval(id);
  }, [skRoomState]);

  /* ── connect ─────────────────────────────────────────────── */
  const connectSocket = useCallback((roomId: string) => {
    wsRef.current?.close();
    setSkConnStatus('connecting');

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setSkConnStatus('connected');
      const token = getToken() ?? '';
      send({ type: 'sk_join', roomId, authToken: token });
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 15_000);
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as SketchioServerMessage;
        switch (msg.type) {
          case 'sk_sync':
            setSkRoomState(msg.state);
            setSkPrivateInfo(msg.privateInfo);
            setSkStrokes(msg.state.strokes ?? []);
            if (prevPhaseRef.current !== msg.state.phase) {
              if (msg.state.phase === 'DRAWING') sounds.playTurnStart();
              if (msg.state.phase === 'ROUND_RESULTS') sounds.playElimination();
              if (msg.state.phase === 'GAME_OVER') sounds.playVictory();
              prevPhaseRef.current = msg.state.phase;
              setSkCloseGuess(null);
            }
            break;
          case 'sk_stroke':
            setSkStrokes(prev => prev.some(s => s.id === msg.stroke.id) ? prev : [...prev, msg.stroke]);
            break;
          case 'sk_clear':
            setSkStrokes([]);
            break;
          case 'sk_undo':
            setSkStrokes(prev => prev.filter(s => s.id !== msg.strokeId));
            break;
          case 'sk_chat':
            setSkRoomState(prev => {
              if (!prev) return prev;
              const msgs = prev.chatMessages.some(m => m.id === msg.msg.id)
                ? prev.chatMessages
                : [...prev.chatMessages, msg.msg].slice(-80);
              return { ...prev, chatMessages: msgs };
            });
            if (!msg.msg.isSystem) sounds.playClick();
            break;
          case 'sk_hint':
            setSkRoomState(prev => prev ? { ...prev, hint: msg.hint } : prev);
            break;
          case 'sk_correct_guess':
            // State update comes via sk_sync; just play sound
            sounds.playVoteCast();
            break;
          case 'sk_close_guess':
            setSkCloseGuess(msg.guess);
            sounds.playTick();
            break;
          case 'sk_room_closed':
            setSkError(msg.reason);
            setSkRoomState(null);
            setSkPrivateInfo(null);
            setSkStrokes([]);
            setSkConnStatus('disconnected');
            wsRef.current?.close();
            break;
          case 'error_message':
            setSkError(msg.message);
            break;
          case 'pong':
            break;
        }
      } catch (e) { console.error('[Sketchio WS] parse error', e); }
    };

    ws.onclose = () => {
      setSkConnStatus('disconnected');
      if (pingRef.current) clearInterval(pingRef.current);
    };
    ws.onerror = () => setSkConnStatus('error');
  }, [send]);

  /* ── public actions ──────────────────────────────────────── */

  const skCreateAndJoin = useCallback(async (settings: Partial<SketchioSettings> = {}) => {
    if (!user) throw new Error('Sign in to create a room.');
    const token = getToken();
    if (!token) throw new Error('No auth token.');
    setSkError(null);
    const { roomId } = await skCreateRoom(token, settings);
    connectSocket(roomId);
  }, [user, connectSocket]);

  const skJoin = useCallback(async (idOrCode: string) => {
    if (!user) throw new Error('Sign in to join a room.');
    setSkError(null);
    const { roomId } = await skGetRoom(idOrCode);
    connectSocket(roomId);
  }, [user, connectSocket]);

  const skLeave = useCallback(() => {
    send({ type: 'sk_leave' });
    wsRef.current?.close();
    setSkRoomState(null);
    setSkPrivateInfo(null);
    setSkStrokes([]);
    prevPhaseRef.current = null;
  }, [send]);

  const skStartGame     = () => send({ type: 'sk_start_game' });
  const skSelectWord    = (word: string) => send({ type: 'sk_select_word', word });
  const skSendGuess     = (text: string) => { if (text.trim()) send({ type: 'sk_guess', text: text.trim() }); };
  const skSendStroke    = (stroke: DrawingStroke) => {
    setSkStrokes(prev => [...prev, stroke]);
    send({ type: 'sk_stroke', stroke });
  };
  const skClearCanvas   = () => { setSkStrokes([]); send({ type: 'sk_clear' }); };
  const skUndoStroke    = () => {
    setSkStrokes(prev => {
      const idx = [...prev].reverse().findIndex(s => s.playerId === (user?.id ?? effectiveProfile.id));
      if (idx === -1) return prev;
      const target = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== target);
    });
    send({ type: 'sk_undo' });
  };
  const skKickPlayer    = (targetPlayerId: string) => send({ type: 'sk_kick_player', targetPlayerId });
  const skUpdateSettings = (settings: Partial<SketchioSettings>) => send({ type: 'sk_update_settings', settings });
  const skRestartGame   = () => send({ type: 'sk_restart' });

  /* ── derived ─────────────────────────────────────────────── */
  const myId       = user?.id ?? effectiveProfile.id;
  const skAmIDrawer = skRoomState?.currentDrawerId === myId;
  const skAmIHost   = skRoomState?.players.find(p => p.id === myId)?.isHost ?? false;
  const skMyPlayer  = skRoomState?.players.find(p => p.id === myId) ?? null;

  return (
    <SketchioContext.Provider value={{
      skRoomState, skPrivateInfo, skStrokes, skConnectionStatus, skError, clearSkError, skTimeRemaining, skCloseGuess,
      skCreateAndJoin, skJoin, skLeave,
      skStartGame, skSelectWord, skSendGuess, skSendStroke, skClearCanvas, skUndoStroke,
      skKickPlayer, skUpdateSettings, skRestartGame,
      skAmIDrawer, skAmIHost, skMyPlayer,
    }}>
      {children}
    </SketchioContext.Provider>
  );
};
