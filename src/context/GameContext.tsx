import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  PublicRoomState,
  ClientPrivateInfo,
  DrawingStroke,
  ChatMessage,
  ServerToClientMessage,
  ClientToServerMessage,
  RoomSettings,
} from '../types/game.js';
import { useAuth } from './AuthContext.js';
import { sounds } from '../services/sound.js';
import { api } from '../services/api.js';
import { voiceService, VoicePermissionStatus } from '../services/voice.js';

export interface VoiceUserStatus {
  isMuted: boolean;
  isSpeaking: boolean;
}

interface GameContextType {
  roomState: PublicRoomState | null;
  privateInfo: ClientPrivateInfo | null;
  strokes: DrawingStroke[];
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string | null;
  clearError: () => void;
  activeRoomId: string | null;
  joinRoom: (idOrCode: string) => Promise<void>;
  leaveRoom: () => void;
  readyMatch: () => void;
  sendStroke: (stroke: DrawingStroke) => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  submitTurn: () => void;
  castVote: (targetPlayerId: string | 'skip') => void;
  submitImposterGuess: (guess: string) => void;
  hostStartGame: () => void;
  hostTogglePause: () => void;
  hostSkipTurn: () => void;
  hostForceVote: () => void;
  hostRestartGame: () => void;
  hostKickPlayer: (targetId: string) => void;
  hostUpdateSettings: (settings: Partial<RoomSettings>) => void;
  hostCloseRoom: () => void;
  isMyTurn: boolean;
  myPlayerInfo: any;
  amIHost: boolean;
  timeRemainingSeconds: number;

  // Real-Time Chat
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  isChatOpen: boolean;
  toggleChat: (open?: boolean) => void;
  sendChatMessage: (text: string) => void;

  // Real-Time WebRTC Voice Chat
  voiceJoined: boolean;
  voiceMuted: boolean;
  voiceSpeaking: boolean;
  voicePermission: VoicePermissionStatus;
  voiceError: string | null;
  voiceParticipants: Record<string, VoiceUserStatus>;
  joinVoiceChat: () => Promise<boolean>;
  leaveVoiceChat: () => void;
  toggleVoiceMute: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { effectiveProfile, user } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null);
  const [privateInfo, setPrivateInfo] = useState<ClientPrivateInfo | null>(null);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Voice Chat State
  const [voiceJoined, setVoiceJoined] = useState<boolean>(false);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [voiceSpeaking, setVoiceSpeaking] = useState<boolean>(false);
  const [voicePermission, setVoicePermission] = useState<VoicePermissionStatus>(voiceService.permissionStatus);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceParticipants, setVoiceParticipants] = useState<Record<string, VoiceUserStatus>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<any>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const isChatOpenRef = useRef<boolean>(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  const clearError = () => setErrorMessage(null);

  // Send message helper
  const sendMessage = useCallback((msg: ClientToServerMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect WebSocket
  const connectSocket = useCallback((roomIdToJoin: string) => {
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (_) {}
    }

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      // Send join room message
      const token = api.getToken() || undefined;
      const joinMsg: ClientToServerMessage = {
        type: 'join_room',
        roomId: roomIdToJoin,
        playerId: user ? user.id : effectiveProfile.id,
        username: user ? user.username : effectiveProfile.username,
        avatar: user ? user.avatar : effectiveProfile.avatar,
        authToken: token,
      };
      ws.send(JSON.stringify(joinMsg));

      // Setup heartbeat ping
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ServerToClientMessage;

        switch (msg.type) {
          case 'sync_state': {
            setRoomState(msg.state);
            setPrivateInfo(msg.privateInfo);
            setStrokes(msg.state.strokes || []);
            if (msg.state.chatMessages) {
              setChatMessages(msg.state.chatMessages);
            }

            // Sync WebRTC audio peers
            const myId = user ? user.id : effectiveProfile.id;
            if (voiceService.isJoinedVoice) {
              voiceService.syncPeers(msg.state.players.map(p => p.id), myId);
            }

            // Play sounds on phase change
            if (prevPhaseRef.current !== msg.state.phase) {
              if (msg.state.phase === 'ROLE_REVEAL') {
                sounds.playRoleReveal();
              } else if (msg.state.phase === 'DRAWING') {
                sounds.playTurnStart();
              } else if (msg.state.phase === 'VOTE_RESULTS') {
                sounds.playElimination();
              } else if (msg.state.phase === 'GAME_OVER') {
                sounds.playVictory();
              }
              prevPhaseRef.current = msg.state.phase;
            }
            break;
          }

          case 'stroke_added': {
            setStrokes(prev => {
              // Deduplicate
              if (prev.some(s => s.id === msg.stroke.id)) return prev;
              return [...prev, msg.stroke];
            });
            break;
          }

          case 'canvas_cleared': {
            setStrokes([]);
            break;
          }

          case 'stroke_undone': {
            setStrokes(prev => prev.filter(s => s.id !== msg.strokeId));
            break;
          }

          case 'chat_message': {
            setChatMessages(prev => {
              if (prev.some(m => m.id === msg.message.id)) return prev;
              return [...prev, msg.message];
            });
            if (!isChatOpenRef.current) {
              setUnreadChatCount(c => c + 1);
            }
            sounds.playClick();
            break;
          }

          case 'chat_history': {
            setChatMessages(msg.messages || []);
            break;
          }

          case 'voice_signal': {
            const myId = user ? user.id : effectiveProfile.id;
            voiceService.handleIncomingSignal(msg.fromPlayerId, msg.signal, myId);
            break;
          }

          case 'voice_status_update': {
            setVoiceParticipants(prev => {
              if (!msg.isJoinedVoice) {
                const next = { ...prev };
                delete next[msg.playerId];
                return next;
              }
              return {
                ...prev,
                [msg.playerId]: { isMuted: msg.isMuted, isSpeaking: msg.isSpeaking },
              };
            });
            break;
          }

          case 'vote_cast': {
            sounds.playVoteCast();
            break;
          }

          case 'room_closed': {
            voiceService.leaveVoice();
            setErrorMessage(msg.reason || 'Room closed.');
            setRoomState(null);
            setPrivateInfo(null);
            setActiveRoomId(null);
            setChatMessages([]);
            setUnreadChatCount(0);
            setIsChatOpen(false);
            setVoiceParticipants({});
            break;
          }

          case 'error_message': {
            setErrorMessage(msg.message);
            break;
          }

          case 'pong':
            break;
        }
      } catch (err) {
        console.error('[Client WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };

    ws.onerror = (err) => {
      console.error('[Client WS] Error:', err);
      setConnectionStatus('error');
    };
  }, [effectiveProfile, user]);

  // Setup voice callbacks
  useEffect(() => {
    voiceService.setCallbacks(
      () => {
        setVoiceJoined(voiceService.isJoinedVoice);
        setVoiceMuted(voiceService.isMuted);
        setVoiceSpeaking(voiceService.isSpeaking);
        setVoicePermission(voiceService.permissionStatus);
        setVoiceError(voiceService.errorMessage);
      },
      (toPlayerId, signal) => {
        sendMessage({ type: 'voice_signal', toPlayerId, signal });
      },
      (isMuted, isSpeaking, isJoinedVoice) => {
        sendMessage({ type: 'voice_status', isMuted, isSpeaking, isJoinedVoice });
      }
    );
  }, [sendMessage]);

  // Join Room
  const joinRoom = useCallback(async (idOrCode: string) => {
    if (!user) {
      const err = new Error('You must be logged in to join a game room. Please log in or register.');
      setErrorMessage(err.message);
      throw err;
    }
    try {
      setErrorMessage(null);
      const cleanCode = idOrCode.trim();
      const info = await api.getRoomInfo(cleanCode);
      setActiveRoomId(info.roomId);
      connectSocket(info.roomId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not find or join room.');
      throw err;
    }
  }, [connectSocket, user]);

  // Leave Room
  const leaveRoom = useCallback(() => {
    voiceService.leaveVoice();
    sendMessage({ type: 'leave_room' });
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (_) {}
    }
    setActiveRoomId(null);
    setRoomState(null);
    setPrivateInfo(null);
    setStrokes([]);
    setChatMessages([]);
    setUnreadChatCount(0);
    setIsChatOpen(false);
    setVoiceParticipants({});
  }, [sendMessage]);

  // Countdown timer calculation based on authoritative deadline
  useEffect(() => {
    const interval = setInterval(() => {
      if (!roomState || !roomState.phaseDeadline || roomState.isPaused) {
        if (roomState?.isPaused && roomState.pausedTimeRemaining !== null) {
          setTimeRemainingSeconds(roomState.pausedTimeRemaining);
        } else {
          setTimeRemainingSeconds(0);
        }
        return;
      }

      const diff = Math.max(0, Math.round((roomState.phaseDeadline - Date.now()) / 1000));
      setTimeRemainingSeconds(diff);

      // Play soft tick sound when low on time
      if (diff > 0 && diff <= 5) {
        sounds.playTick();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [roomState]);

  // Chat Actions
  const toggleChat = useCallback((open?: boolean) => {
    setIsChatOpen(prev => {
      const next = typeof open === 'boolean' ? open : !prev;
      if (next) setUnreadChatCount(0);
      return next;
    });
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    sendMessage({ type: 'send_chat', text: text.trim() });
  }, [sendMessage]);

  // Voice Actions
  const joinVoiceChat = useCallback(async () => {
    const ok = await voiceService.joinVoice();
    if (ok && roomState) {
      const myId = user ? user.id : effectiveProfile.id;
      voiceService.syncPeers(roomState.players.map(p => p.id), myId);
    }
    return ok;
  }, [roomState, user, effectiveProfile]);

  const leaveVoiceChat = useCallback(() => {
    voiceService.leaveVoice();
  }, []);

  const toggleVoiceMute = useCallback(() => {
    voiceService.toggleMute();
  }, []);

  // Game Actions
  const readyMatch = () => {
    sounds.playClick();
    sendMessage({ type: 'ready_match' });
  };

  const sendStroke = (stroke: DrawingStroke) => {
    // Optimistic local add
    setStrokes(prev => [...prev, stroke]);
    sendMessage({ type: 'draw_stroke', stroke });
  };

  const clearCanvas = () => {
    sounds.playClick();
    setStrokes([]);
    sendMessage({ type: 'clear_canvas' });
  };

  const undoStroke = () => {
    sounds.playClick();
    // Optimistically remove last stroke made by this player
    setStrokes(prev => {
      const idx = [...prev].reverse().findIndex(s => s.playerId === effectiveProfile.id);
      if (idx === -1) return prev;
      const targetIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== targetIdx);
    });
    sendMessage({ type: 'undo_stroke' });
  };

  const submitTurn = () => {
    sounds.playClick();
    sendMessage({ type: 'submit_turn' });
  };

  const castVote = (targetPlayerId: string | 'skip') => {
    sounds.playVoteCast();
    sendMessage({ type: 'cast_vote', targetPlayerId });
  };

  const submitImposterGuess = (guess: string) => {
    sounds.playClick();
    sendMessage({ type: 'submit_imposter_guess', guess });
  };

  const hostStartGame = () => {
    sounds.playClick();
    sendMessage({ type: 'host_start_game' });
  };

  const hostTogglePause = () => {
    sounds.playClick();
    sendMessage({ type: 'host_pause_toggle' });
  };

  const hostSkipTurn = () => {
    sounds.playClick();
    sendMessage({ type: 'host_skip_turn' });
  };

  const hostForceVote = () => {
    sounds.playClick();
    sendMessage({ type: 'host_force_vote' });
  };

  const hostRestartGame = () => {
    sounds.playClick();
    sendMessage({ type: 'host_restart_game' });
  };

  const hostKickPlayer = (targetId: string) => {
    sounds.playClick();
    sendMessage({ type: 'host_kick_player', targetPlayerId: targetId });
  };

  const hostUpdateSettings = (settings: Partial<RoomSettings>) => {
    sendMessage({ type: 'host_update_settings', settings });
  };

  const hostCloseRoom = () => {
    sounds.playClick();
    sendMessage({ type: 'host_close_room' });
  };

  const myPlayerInfo = roomState?.players.find(p => p.id === effectiveProfile.id) || null;
  const amIHost = !!myPlayerInfo?.isHost;
  const isMyTurn = roomState?.phase === 'DRAWING' && roomState?.currentDrawerId === effectiveProfile.id;

  return (
    <GameContext.Provider
      value={{
        roomState,
        privateInfo,
        strokes,
        connectionStatus,
        errorMessage,
        clearError,
        activeRoomId,
        joinRoom,
        leaveRoom,
        readyMatch,
        sendStroke,
        clearCanvas,
        undoStroke,
        submitTurn,
        castVote,
        submitImposterGuess,
        hostStartGame,
        hostTogglePause,
        hostSkipTurn,
        hostForceVote,
        hostRestartGame,
        hostKickPlayer,
        hostUpdateSettings,
        hostCloseRoom,
        isMyTurn,
        myPlayerInfo,
        amIHost,
        timeRemainingSeconds,

        // Real-Time Chat
        chatMessages,
        unreadChatCount,
        isChatOpen,
        toggleChat,
        sendChatMessage,

        // Real-Time Voice Chat
        voiceJoined,
        voiceMuted,
        voiceSpeaking,
        voicePermission,
        voiceError,
        voiceParticipants,
        joinVoiceChat,
        leaveVoiceChat,
        toggleVoiceMute,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
};

