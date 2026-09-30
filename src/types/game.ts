export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'DRAWING'
  | 'VOTING'
  | 'VOTE_RESULTS'
  | 'IMPOSTER_GUESS'
  | 'GAME_OVER';

export type PlayerRole = 'CREW' | 'IMPOSTER';

export interface UserStats {
  gamesPlayed: number;
  crewWins: number;
  imposterWins: number;
  timesImposter: number;
  timesEliminated: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: number;
  stats: UserStats;
}

export interface RoomSettings {
  maxPlayers: number;
  impostersCount: number;
  drawingTimeSeconds: number;
  drawingRounds: number;
  votingTimeSeconds: number;
  allowLateJoin: boolean;
  imposterFinalGuess: boolean;
  wordCategory: string;
  isPrivate: boolean;
}

export interface PlayerPublicInfo {
  id: string;
  userId?: string | null;
  username: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  hasVoted: boolean;
  isReady: boolean;
}

export interface DrawingPoint {
  x: number; // 0.0 to 1.0 (relative canvas width)
  y: number; // 0.0 to 1.0 (relative canvas height)
}

export interface DrawingStroke {
  id: string;
  playerId: string;
  playerName: string;
  color: string;
  size: number;
  isEraser?: boolean;
  isFill?: boolean;
  fillPoint?: DrawingPoint;
  points: DrawingPoint[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

export interface VoiceParticipantInfo {
  playerId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface VoteResult {
  counts: Record<string, number>; // playerId -> count, 'skip' -> count
  eliminatedPlayerId: string | null;
  eliminatedPlayerName: string | null;
  eliminatedPlayerRole: PlayerRole | null;
  isTie: boolean;
  explanation: string;
}

export interface MatchHistoryEntry {
  id: string;
  roomId: string;
  timestamp: number;
  durationSeconds: number;
  secretWord: string;
  category: string;
  winner: 'CREW' | 'IMPOSTER';
  imposters: { id: string; name: string }[];
  playersCount: number;
  eliminatedPlayers: { name: string; role: PlayerRole }[];
}

export interface PublicRoomState {
  roomId: string;
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  phaseDeadline: number | null; // epoch ms
  isPaused: boolean;
  pausedTimeRemaining: number | null; // seconds remaining when paused
  settings: RoomSettings;
  players: PlayerPublicInfo[];
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  turnOrder: string[];
  strokes: DrawingStroke[];
  chatMessages: ChatMessage[];
  lastVoteResult: VoteResult | null;
  winner: 'CREW' | 'IMPOSTER' | null;
  revealedImposters: { id: string; username: string }[] | null;
  revealedSecretWord: string | null;
  imposterGuessResult: { guess: string; isCorrect: boolean } | null;
  createdAt: number;
}

export interface ClientPrivateInfo {
  playerId: string;
  role: PlayerRole | null;
  secretWord: string | null; // null if imposter!
}

// WebSocket Message Types
export type ClientToServerMessage =
  | { type: 'join_room'; roomId: string; playerId: string; username: string; avatar: string; authToken?: string }
  | { type: 'ready_match' }
  | { type: 'draw_stroke'; stroke: DrawingStroke }
  | { type: 'clear_canvas' }
  | { type: 'undo_stroke' }
  | { type: 'submit_turn' }
  | { type: 'send_chat'; text: string }
  | { type: 'voice_signal'; toPlayerId: string; signal: any }
  | { type: 'voice_status'; isMuted: boolean; isSpeaking: boolean; isJoinedVoice: boolean }
  | { type: 'cast_vote'; targetPlayerId: string | 'skip' }
  | { type: 'submit_imposter_guess'; guess: string }
  | { type: 'host_start_game' }
  | { type: 'host_pause_toggle' }
  | { type: 'host_skip_turn' }
  | { type: 'host_force_vote' }
  | { type: 'host_restart_game' }
  | { type: 'host_kick_player'; targetPlayerId: string }
  | { type: 'host_update_settings'; settings: Partial<RoomSettings> }
  | { type: 'host_close_room' }
  | { type: 'leave_room' }
  | { type: 'ping' };

export type ServerToClientMessage =
  | { type: 'sync_state'; state: PublicRoomState; privateInfo: ClientPrivateInfo }
  | { type: 'stroke_added'; stroke: DrawingStroke }
  | { type: 'canvas_cleared' }
  | { type: 'stroke_undone'; strokeId: string }
  | { type: 'chat_message'; message: ChatMessage }
  | { type: 'chat_history'; messages: ChatMessage[] }
  | { type: 'voice_signal'; fromPlayerId: string; signal: any }
  | { type: 'voice_status_update'; playerId: string; isMuted: boolean; isSpeaking: boolean; isJoinedVoice: boolean }
  | { type: 'voice_participants'; participants: VoiceParticipantInfo[] }
  | { type: 'player_joined'; player: PlayerPublicInfo }
  | { type: 'player_left'; playerId: string; username: string }
  | { type: 'vote_cast'; voterId: string }
  | { type: 'room_closed'; reason: string }
  | { type: 'error_message'; message: string }
  | { type: 'pong' };


// ═══════════════════════════════════════════════════════════════
// SKETCHIO — Skribbl.io-style game types
// ═══════════════════════════════════════════════════════════════

export type SketchioPhase =
  | 'LOBBY'
  | 'WORD_SELECT'    // active drawer picks one of 3 word choices (10 s)
  | 'DRAWING'        // drawer draws, everyone else guesses via chat (80 s default)
  | 'ROUND_RESULTS'  // show who guessed, points earned, correct word (5 s)
  | 'GAME_OVER';     // final scoreboard

export interface SketchioSettings {
  maxPlayers: number;          // 2–12, default 8
  drawingTimeSeconds: number;  // default 80
  rounds: number;              // default 3 (each player draws once per round)
  wordChoices: number;         // default 3 words to pick from
  hintInterval: number;        // seconds between hints (default 20)
  isPrivate: boolean;
}

export interface SketchioPlayerInfo {
  id: string;
  userId: string | null;
  username: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  score: number;
  hasGuessedThisRound: boolean;
  guessTimeMs: number | null;  // ms after round start when guessed (for speed bonus)
}

export interface SketchioGuessEvent {
  playerId: string;
  playerName: string;
  playerAvatar: string;
  text: string;               // original guess text (shown to guesser before reveal)
  isCorrect: boolean;
  pointsEarned: number;
  timestamp: number;
  guessTimeMs: number;
}

export interface SketchioRoundResult {
  roundNumber: number;
  drawerId: string;
  drawerName: string;
  word: string;
  correctGuessers: { id: string; username: string; points: number; timeMs: number }[];
  drawerPoints: number;       // drawer earns points per correct guesser
  scores: Record<string, number>; // playerId -> total cumulative score after this round
}

export interface SketchioRoomState {
  roomId: string;
  roomCode: string;
  hostId: string;
  phase: SketchioPhase;
  phaseDeadline: number | null;
  settings: SketchioSettings;
  players: SketchioPlayerInfo[];
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  turnOrder: string[];          // player ids for this round's turn order
  currentTurnIndex: number;
  strokes: DrawingStroke[];
  hint: string;                 // e.g. "_ _ _ _ _" with revealed letters
  wordLength: number;
  chatMessages: SketchioChat[];
  guessEvents: SketchioGuessEvent[];  // correct guesses (with points) this round
  lastRoundResult: SketchioRoundResult | null;
  createdAt: number;
}

/** A chat line in Sketchio — may be a guess attempt or a system message */
export interface SketchioChat {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  isCorrectGuess: boolean;   // true = show as "✓ guessed correctly!" banner
  isSystem: boolean;         // true = system announce (round start, hint, etc.)
  timestamp: number;
}

/** What the server sends privately to the active drawer */
export interface SketchioPrivateInfo {
  playerId: string;
  isDrawer: boolean;
  currentWord: string | null;          // null for guessers
  wordChoices: string[] | null;        // only during WORD_SELECT phase for drawer
}

// ── Sketchio Client → Server messages ───────────────────────────
export type SketchioClientMessage =
  | { type: 'sk_join';       roomId: string; authToken: string }
  | { type: 'sk_ready' }
  | { type: 'sk_select_word'; word: string }
  | { type: 'sk_guess';       text: string }
  | { type: 'sk_stroke';      stroke: DrawingStroke }
  | { type: 'sk_clear' }
  | { type: 'sk_undo' }
  | { type: 'sk_start_game' }
  | { type: 'sk_kick_player'; targetPlayerId: string }
  | { type: 'sk_update_settings'; settings: Partial<SketchioSettings> }
  | { type: 'sk_leave' }
  | { type: 'sk_restart' }
  | { type: 'ping' };

// ── Sketchio Server → Client messages ───────────────────────────
export type SketchioServerMessage =
  | { type: 'sk_sync';        state: SketchioRoomState; privateInfo: SketchioPrivateInfo }
  | { type: 'sk_stroke';      stroke: DrawingStroke }
  | { type: 'sk_clear' }
  | { type: 'sk_undo';        strokeId: string }
  | { type: 'sk_chat';        msg: SketchioChat }
  | { type: 'sk_hint';        hint: string }
  | { type: 'sk_correct_guess'; playerId: string; playerName: string; points: number }
  | { type: 'sk_close_guess'; guess: string }
  | { type: 'sk_room_closed'; reason: string }
  | { type: 'error_message';  message: string }
  | { type: 'pong' };
