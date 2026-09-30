import { WebSocket } from 'ws';
import crypto from 'crypto';
import {
  GamePhase,
  PlayerRole,
  RoomSettings,
  PlayerPublicInfo,
  DrawingStroke,
  PublicRoomState,
  ClientPrivateInfo,
  VoteResult,
  MatchHistoryEntry,
  ServerToClientMessage,
  ChatMessage,
  VoiceParticipantInfo,
} from '../src/types/game.js';
import { getRandomWord, isGuessCorrect } from '../src/utils/words.js';
import { db } from './db.js';

interface InternalPlayer {
  id: string;
  userId: string | null;
  username: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  hasVoted: boolean;
  isReady: boolean;
  role: PlayerRole | null;
  ws?: WebSocket;
  disconnectTimeout?: NodeJS.Timeout;
}

interface InternalRoom {
  roomId: string;
  roomCode: string;
  hostId: string;
  settings: RoomSettings;
  phase: GamePhase;
  phaseDeadline: number | null;
  isPaused: boolean;
  pausedTimeRemaining: number | null;
  players: Map<string, InternalPlayer>; // playerId -> InternalPlayer
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  turnOrder: string[];
  currentTurnIndex: number;
  strokes: DrawingStroke[];
  chatMessages: ChatMessage[];
  voiceParticipants: Map<string, { isMuted: boolean; isSpeaking: boolean }>;
  votes: Map<string, string>; // voterId -> targetPlayerId | 'skip'
  lastVoteResult: VoteResult | null;
  secretWord: string;
  secretCategory: string;
  winner: 'CREW' | 'IMPOSTER' | null;
  revealedImposters: { id: string; username: string }[] | null;
  revealedSecretWord: string | null;
  imposterGuessResult: { guess: string; isCorrect: boolean } | null;
  timer: NodeJS.Timeout | null;
  createdAt: number;
  matchStartTime: number | null;
  eliminatedHistory: { name: string; role: PlayerRole }[];
}

export class GameManager {
  private rooms: Map<string, InternalRoom> = new Map(); // roomId or roomCode -> InternalRoom
  private playerRoomMap: Map<string, string> = new Map(); // playerId -> roomId

  constructor() {}

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure unique
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  public createRoom(
    hostPlayerId: string,
    hostUsername: string,
    hostAvatar: string,
    hostUserId: string | null,
    settings: Partial<RoomSettings> = {}
  ): { roomId: string; roomCode: string } {
    const roomId = 'room_' + crypto.randomBytes(6).toString('hex');
    const roomCode = this.generateRoomCode();

    const mergedSettings: RoomSettings = {
      maxPlayers: Math.min(12, Math.max(3, settings.maxPlayers ?? 8)),
      impostersCount: Math.max(1, Math.min(2, settings.impostersCount ?? 1)),
      drawingTimeSeconds: settings.drawingTimeSeconds ?? 30,
      drawingRounds: settings.drawingRounds ?? 1,
      votingTimeSeconds: settings.votingTimeSeconds ?? 30,
      allowLateJoin: settings.allowLateJoin ?? false,
      imposterFinalGuess: settings.imposterFinalGuess ?? true,
      wordCategory: settings.wordCategory ?? 'All',
      isPrivate: settings.isPrivate ?? true,
    };

    const hostPlayer: InternalPlayer = {
      id: hostPlayerId,
      userId: hostUserId,
      username: hostUsername,
      avatar: hostAvatar,
      isHost: true,
      isConnected: true,
      isEliminated: false,
      hasVoted: false,
      isReady: false,
      role: null,
    };

    const room: InternalRoom = {
      roomId,
      roomCode,
      hostId: hostPlayerId,
      settings: mergedSettings,
      phase: 'LOBBY',
      phaseDeadline: null,
      isPaused: false,
      pausedTimeRemaining: null,
      players: new Map([[hostPlayerId, hostPlayer]]),
      currentRound: 1,
      totalRounds: mergedSettings.drawingRounds,
      currentDrawerId: null,
      turnOrder: [],
      currentTurnIndex: 0,
      strokes: [],
      chatMessages: [],
      voiceParticipants: new Map(),
      votes: new Map(),
      lastVoteResult: null,
      secretWord: '',
      secretCategory: '',
      winner: null,
      revealedImposters: null,
      revealedSecretWord: null,
      imposterGuessResult: null,
      timer: null,
      createdAt: Date.now(),
      matchStartTime: null,
      eliminatedHistory: [],
    };

    this.rooms.set(roomId, room);
    this.rooms.set(roomCode, room); // lookup by code as well
    this.playerRoomMap.set(hostPlayerId, roomId);

    return { roomId, roomCode };
  }

  public getRoom(idOrCode: string): InternalRoom | null {
    if (!idOrCode) return null;
    return this.rooms.get(idOrCode) || this.rooms.get(idOrCode.toUpperCase()) || null;
  }

  public joinRoom(
    idOrCode: string,
    playerInfo: { id: string; username: string; avatar: string; userId: string | null },
    ws: WebSocket
  ): { room: InternalRoom; player: InternalPlayer } {
    const room = this.getRoom(idOrCode);
    if (!room) {
      throw new Error('Room not found. Please verify the Room ID.');
    }

    // Check if player is reconnecting
    let player = room.players.get(playerInfo.id);

    if (player) {
      // Reconnect
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
        player.disconnectTimeout = undefined;
      }
      player.isConnected = true;
      player.ws = ws;
      player.username = playerInfo.username || player.username;
      player.avatar = playerInfo.avatar || player.avatar;
    } else {
      // New join
      if (room.players.size >= room.settings.maxPlayers) {
        throw new Error('This game room is already full.');
      }
      if (room.phase !== 'LOBBY' && !room.settings.allowLateJoin) {
        throw new Error('Game in progress. Late joining is not allowed in this room.');
      }

      player = {
        id: playerInfo.id,
        userId: playerInfo.userId,
        username: playerInfo.username,
        avatar: playerInfo.avatar,
        isHost: room.players.size === 0, // First player becomes host if empty
        isConnected: true,
        isEliminated: room.phase !== 'LOBBY', // Late joiners spectate current match
        hasVoted: false,
        isReady: false,
        role: room.phase !== 'LOBBY' ? 'CREW' : null,
        ws,
      };

      room.players.set(player.id, player);
      this.playerRoomMap.set(player.id, room.roomId);
    }

    this.broadcastToRoom(room, {
      type: 'player_joined',
      player: this.toPublicPlayer(player),
    });

    return { room, player };
  }

  public handleDisconnect(playerId: string) {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isConnected = false;
    player.ws = undefined;

    // Set grace period of 45 seconds for reconnection before marking inactive or transferring host
    player.disconnectTimeout = setTimeout(() => {
      if (!player.isConnected) {
        // If in lobby, remove completely
        if (room.phase === 'LOBBY') {
          room.players.delete(playerId);
          this.playerRoomMap.delete(playerId);

          // If was host, transfer host
          if (player.isHost && room.players.size > 0) {
            const nextHost = Array.from(room.players.values())[0];
            nextHost.isHost = true;
            room.hostId = nextHost.id;
          }
        } else {
          // If in game, auto-skip their turn if active
          if (room.currentDrawerId === playerId && room.phase === 'DRAWING') {
            this.advanceTurn(room);
          }
        }

        // Close room if completely empty
        if (Array.from(room.players.values()).every(p => !p.isConnected)) {
          this.closeRoom(room.roomId, 'All players disconnected.');
        } else {
          this.syncRoomState(room);
        }
      }
    }, 45000);

    this.syncRoomState(room);
  }

  public leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    if (player.disconnectTimeout) {
      clearTimeout(player.disconnectTimeout);
      player.disconnectTimeout = undefined;
    }

    // Remove player from room
    room.players.delete(playerId);
    this.playerRoomMap.delete(playerId);
    room.votes.delete(playerId);

    // If was host and players remain, transfer host to next connected player
    if (player.isHost) {
      const nextHost = Array.from(room.players.values()).find(p => p.isConnected) || Array.from(room.players.values())[0];
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
      }
    }

    // If no players remain or no connected players, close room
    const connectedCount = Array.from(room.players.values()).filter(p => p.isConnected).length;
    if (room.players.size === 0 || connectedCount === 0) {
      this.closeRoom(room.roomId, 'All players have left the room.');
      return;
    }

    // If during ROLE_REVEAL, check if all remaining connected players are ready
    if (room.phase === 'ROLE_REVEAL') {
      const allReady = Array.from(room.players.values())
        .filter(p => p.isConnected && !p.isEliminated)
        .every(p => p.isReady);
      if (allReady && connectedCount >= 2) {
        this.clearPhaseTimer(room);
        this.startDrawingPhase(room);
        return;
      }
    }

    // If in DRAWING phase, adjust turnOrder and advance turn if they were the active drawer
    if (room.phase === 'DRAWING') {
      room.turnOrder = room.turnOrder.filter(id => id !== playerId);
      if (room.currentDrawerId === playerId) {
        this.advanceTurn(room);
        return;
      }
    }

    // If in VOTING phase, check if all remaining alive connected players have voted
    if (room.phase === 'VOTING') {
      const alivePlayers = Array.from(room.players.values()).filter(p => !p.isEliminated && p.isConnected);
      const allVoted = alivePlayers.length > 0 && alivePlayers.every(p => room.votes.has(p.id));
      if (allVoted) {
        this.clearPhaseTimer(room);
        this.concludeVoting(room);
        return;
      }
    }

    // If in IMPOSTER_GUESS phase and no alive imposter remains
    if (room.phase === 'IMPOSTER_GUESS') {
      const aliveImposters = Array.from(room.players.values()).filter(p => p.role === 'IMPOSTER');
      if (aliveImposters.length === 0) {
        this.concludeGame(room, 'CREW', 'The Imposter left the match.');
        return;
      }
    }

    // If active game has fewer than 2 connected players
    if (room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER' && connectedCount < 2) {
      this.concludeGame(room, 'CREW', 'Not enough players remain to continue the match.');
      return;
    }

    this.syncRoomState(room);
  }

  // GAME ACTIONS
  public startGame(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found');
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) throw new Error('Only the room host can start the game.');

    const activePlayers = Array.from(room.players.values()).filter(p => p.isConnected);
    if (activePlayers.length < 2) {
      throw new Error('At least 2 players are required to start the game.');
    }

    // Pick Word
    const { word, category } = getRandomWord(room.settings.wordCategory);
    room.secretWord = word;
    room.secretCategory = category;

    // Assign Roles
    const playersList = Array.from(room.players.values());
    // Shuffle
    const shuffled = [...playersList].sort(() => Math.random() - 0.5);

    const imposterCount = Math.min(room.settings.impostersCount, Math.max(1, Math.floor((playersList.length - 1) / 2)));
    for (let i = 0; i < shuffled.length; i++) {
      const p = shuffled[i];
      p.isEliminated = false;
      p.hasVoted = false;
      p.isReady = false;
      if (i < imposterCount) {
        p.role = 'IMPOSTER';
      } else {
        p.role = 'CREW';
      }
    }

    // Initialize Match State
    room.phase = 'ROLE_REVEAL';
    room.currentRound = 1;
    room.totalRounds = room.settings.drawingRounds;
    room.strokes = [];
    room.votes.clear();
    room.lastVoteResult = null;
    room.winner = null;
    room.revealedImposters = null;
    room.revealedSecretWord = null;
    room.imposterGuessResult = null;
    room.matchStartTime = Date.now();
    room.eliminatedHistory = [];

    // Role reveal duration: 8 seconds
    this.setPhaseTimer(room, 8, () => {
      this.startDrawingPhase(room);
    });

    this.syncRoomState(room);
  }

  public setPlayerReady(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'ROLE_REVEAL') return;
    const player = room.players.get(playerId);
    if (!player) return;

    player.isReady = true;

    // If all connected players are ready, jump directly to drawing!
    const allReady = Array.from(room.players.values())
      .filter(p => p.isConnected && !p.isEliminated)
      .every(p => p.isReady);

    if (allReady) {
      this.clearPhaseTimer(room);
      this.startDrawingPhase(room);
    } else {
      this.syncRoomState(room);
    }
  }

  private startDrawingPhase(room: InternalRoom) {
    room.phase = 'DRAWING';
    // Active drawers: alive connected players
    const alivePlayers = Array.from(room.players.values()).filter(p => !p.isEliminated && p.isConnected);
    room.turnOrder = alivePlayers.map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;
    room.currentDrawerId = room.turnOrder[0] || null;

    if (!room.currentDrawerId) {
      this.startVotingPhase(room);
      return;
    }

    this.setPhaseTimer(room, room.settings.drawingTimeSeconds, () => {
      this.advanceTurn(room);
    });

    this.syncRoomState(room);
  }

  public addStroke(roomId: string, playerId: string, stroke: DrawingStroke) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING' || room.isPaused) return;

    // Validate that sender is the active drawer
    if (room.currentDrawerId !== playerId) return;

    room.strokes.push(stroke);

    // Broadcast stroke to all clients in room
    this.broadcastToRoom(room, {
      type: 'stroke_added',
      stroke,
    });
  }

  public clearCanvas(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING' || room.isPaused) return;
    const player = room.players.get(playerId);
    if (!player) return;

    // Only active drawer or host can clear
    if (room.currentDrawerId !== playerId && !player.isHost) return;

    room.strokes = [];
    this.broadcastToRoom(room, { type: 'canvas_cleared' });
  }

  public undoStroke(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING' || room.isPaused) return;
    if (room.currentDrawerId !== playerId) return;

    // Find and remove last stroke by this player
    for (let i = room.strokes.length - 1; i >= 0; i--) {
      if (room.strokes[i].playerId === playerId) {
        const removed = room.strokes.splice(i, 1)[0];
        this.broadcastToRoom(room, { type: 'stroke_undone', strokeId: removed.id });
        break;
      }
    }
  }

  public submitTurn(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    if (room.currentDrawerId !== playerId) return;

    this.advanceTurn(room);
  }

  private advanceTurn(room: InternalRoom) {
    this.clearPhaseTimer(room);

    room.currentTurnIndex += 1;
    if (room.currentTurnIndex < room.turnOrder.length) {
      room.currentDrawerId = room.turnOrder[room.currentTurnIndex];
      this.setPhaseTimer(room, room.settings.drawingTimeSeconds, () => {
        this.advanceTurn(room);
      });
      this.syncRoomState(room);
    } else {
      // Completed all players for this round
      if (room.currentRound < room.totalRounds) {
        room.currentRound += 1;
        // Reshuffle turn order for next round
        const alivePlayers = Array.from(room.players.values()).filter(p => !p.isEliminated && p.isConnected);
        room.turnOrder = alivePlayers.map(p => p.id).sort(() => Math.random() - 0.5);
        room.currentTurnIndex = 0;
        room.currentDrawerId = room.turnOrder[0] || null;

        this.setPhaseTimer(room, room.settings.drawingTimeSeconds, () => {
          this.advanceTurn(room);
        });
        this.syncRoomState(room);
      } else {
        // Transition to Voting!
        this.startVotingPhase(room);
      }
    }
  }

  private startVotingPhase(room: InternalRoom) {
    room.phase = 'VOTING';
    room.currentDrawerId = null;
    room.votes.clear();

    // Reset hasVoted
    for (const p of room.players.values()) {
      p.hasVoted = false;
    }

    this.setPhaseTimer(room, room.settings.votingTimeSeconds, () => {
      this.concludeVoting(room);
    });

    this.syncRoomState(room);
  }

  public castVote(roomId: string, voterId: string, targetPlayerId: string | 'skip') {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'VOTING' || room.isPaused) return;

    const voter = room.players.get(voterId);
    if (!voter || voter.isEliminated || voter.hasVoted) return;

    // Cannot vote for oneself
    if (targetPlayerId === voterId) return;

    room.votes.set(voterId, targetPlayerId);
    voter.hasVoted = true;

    // Broadcast that player voted (without revealing vote target)
    this.broadcastToRoom(room, {
      type: 'vote_cast',
      voterId,
    });

    // Check if all alive connected players have voted
    const alivePlayers = Array.from(room.players.values()).filter(p => !p.isEliminated && p.isConnected);
    const allVoted = alivePlayers.every(p => room.votes.has(p.id));

    if (allVoted) {
      this.clearPhaseTimer(room);
      this.concludeVoting(room);
    } else {
      this.syncRoomState(room);
    }
  }

  private concludeVoting(room: InternalRoom) {
    this.clearPhaseTimer(room);

    // Tally votes
    const counts: Record<string, number> = {};
    for (const target of room.votes.values()) {
      counts[target] = (counts[target] || 0) + 1;
    }

    // Determine highest vote
    let maxVotes = 0;
    let topTarget: string | null = null;
    let isTie = false;

    for (const [target, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        topTarget = target;
        isTie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        isTie = true;
      }
    }

    let eliminatedPlayer: InternalPlayer | null = null;
    let explanation = '';

    if (isTie || !topTarget || topTarget === 'skip' || maxVotes < 1) {
      isTie = true;
      explanation = 'Voting resulted in a tie or skip. No player was eliminated!';
    } else {
      eliminatedPlayer = room.players.get(topTarget) || null;
      if (eliminatedPlayer) {
        eliminatedPlayer.isEliminated = true;
        room.eliminatedHistory.push({
          name: eliminatedPlayer.username,
          role: eliminatedPlayer.role || 'CREW',
        });
        if (eliminatedPlayer.role === 'IMPOSTER') {
          explanation = `${eliminatedPlayer.username} was eliminated! They were the IMPOSTER!`;
        } else {
          explanation = `${eliminatedPlayer.username} was eliminated! They were an innocent CREW MEMBER.`;
        }
      }
    }

    const voteResult: VoteResult = {
      counts,
      eliminatedPlayerId: eliminatedPlayer ? eliminatedPlayer.id : null,
      eliminatedPlayerName: eliminatedPlayer ? eliminatedPlayer.username : null,
      eliminatedPlayerRole: eliminatedPlayer ? eliminatedPlayer.role : null,
      isTie,
      explanation,
    };

    room.lastVoteResult = voteResult;
    room.phase = 'VOTE_RESULTS';

    // Check game condition:
    const aliveImposters = Array.from(room.players.values()).filter(p => !p.isEliminated && p.role === 'IMPOSTER');
    const aliveCrew = Array.from(room.players.values()).filter(p => !p.isEliminated && p.role === 'CREW');

    // Case 1: Imposter was eliminated!
    if (eliminatedPlayer && eliminatedPlayer.role === 'IMPOSTER') {
      if (aliveImposters.length === 0) {
        // All imposters eliminated!
        if (room.settings.imposterFinalGuess) {
          // 4-second delay on results, then transition to IMPOSTER_GUESS
          this.setPhaseTimer(room, 4, () => {
            room.phase = 'IMPOSTER_GUESS';
            this.setPhaseTimer(room, 30, () => {
              // Timeout on guess: Crew wins
              this.concludeGame(room, 'CREW', 'Time expired for Imposter guess.');
            });
            this.syncRoomState(room);
          });
        } else {
          // Crew wins immediately
          this.setPhaseTimer(room, 4, () => {
            this.concludeGame(room, 'CREW', 'All Imposters have been eliminated!');
          });
        }
        this.syncRoomState(room);
        return;
      }
    }

    // Case 2: Imposters outnumber or equal crew
    if (aliveImposters.length >= aliveCrew.length && aliveCrew.length > 0) {
      this.setPhaseTimer(room, 4, () => {
        this.concludeGame(room, 'IMPOSTER', 'Imposters have overpowered the remaining crew!');
      });
      this.syncRoomState(room);
      return;
    }

    // Case 3: Still ongoing - advance to another drawing cycle or sudden-death discussion
    this.setPhaseTimer(room, 5, () => {
      // Start another round
      room.totalRounds += 1;
      room.currentRound += 1;
      this.startDrawingPhase(room);
    });

    this.syncRoomState(room);
  }

  public submitImposterGuess(roomId: string, playerId: string, guess: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'IMPOSTER_GUESS') return;

    // Verify sender was the eliminated imposter
    const player = room.players.get(playerId);
    if (!player || player.role !== 'IMPOSTER') return;

    this.clearPhaseTimer(room);

    const isCorrect = isGuessCorrect(guess, room.secretWord);
    room.imposterGuessResult = { guess, isCorrect };

    if (isCorrect) {
      this.concludeGame(room, 'IMPOSTER', `The Imposter correctly guessed the secret word: "${room.secretWord}"!`);
    } else {
      this.concludeGame(room, 'CREW', `The Imposter's guess "${guess}" was incorrect! Secret word was "${room.secretWord}".`);
    }
  }

  private concludeGame(room: InternalRoom, winner: 'CREW' | 'IMPOSTER', reason: string) {
    this.clearPhaseTimer(room);
    room.phase = 'GAME_OVER';
    room.winner = winner;
    room.revealedSecretWord = room.secretWord;
    room.revealedImposters = Array.from(room.players.values())
      .filter(p => p.role === 'IMPOSTER')
      .map(p => ({ id: p.id, username: p.username }));

    const durationSeconds = room.matchStartTime ? Math.round((Date.now() - room.matchStartTime) / 1000) : 0;

    const historyEntry: MatchHistoryEntry = {
      id: 'match_' + crypto.randomBytes(6).toString('hex'),
      roomId: room.roomId,
      timestamp: Date.now(),
      durationSeconds,
      secretWord: room.secretWord,
      category: room.secretCategory,
      winner,
      imposters: (room.revealedImposters || []).map((imp) => ({ id: imp.id, name: imp.username })),
      playersCount: room.players.size,
      eliminatedPlayers: [...room.eliminatedHistory],
    };

    // Update DB stats
    const statsUpdates = Array.from(room.players.values()).map(p => ({
      userId: p.userId || '',
      role: p.role || ('CREW' as PlayerRole),
      won: p.role === winner,
      eliminated: p.isEliminated,
    }));

    db.recordMatchOutcome(historyEntry, statsUpdates);
    this.syncRoomState(room);
  }

  public restartGame(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    // Reset room back to LOBBY
    this.clearPhaseTimer(room);
    room.phase = 'LOBBY';
    room.currentRound = 1;
    room.totalRounds = room.settings.drawingRounds;
    room.currentDrawerId = null;
    room.turnOrder = [];
    room.currentTurnIndex = 0;
    room.strokes = [];
    room.votes.clear();
    room.lastVoteResult = null;
    room.winner = null;
    room.revealedImposters = null;
    room.revealedSecretWord = null;
    room.imposterGuessResult = null;
    room.isPaused = false;
    room.pausedTimeRemaining = null;

    for (const p of room.players.values()) {
      p.isEliminated = false;
      p.hasVoted = false;
      p.isReady = false;
      p.role = null;
    }

    this.syncRoomState(room);
  }

  // HOST CONTROLS
  public togglePause(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase === 'LOBBY' || room.phase === 'GAME_OVER') return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    if (!room.isPaused) {
      // Pause
      room.isPaused = true;
      if (room.phaseDeadline) {
        room.pausedTimeRemaining = Math.max(0, Math.round((room.phaseDeadline - Date.now()) / 1000));
      }
      this.clearPhaseTimer(room);
    } else {
      // Resume
      room.isPaused = false;
      const remainingSeconds = room.pausedTimeRemaining || 10;
      room.pausedTimeRemaining = null;

      if (room.phase === 'DRAWING') {
        this.setPhaseTimer(room, remainingSeconds, () => this.advanceTurn(room));
      } else if (room.phase === 'VOTING') {
        this.setPhaseTimer(room, remainingSeconds, () => this.concludeVoting(room));
      } else if (room.phase === 'IMPOSTER_GUESS') {
        this.setPhaseTimer(room, remainingSeconds, () => this.concludeGame(room, 'CREW', 'Timeout'));
      }
    }

    this.syncRoomState(room);
  }

  public skipTurn(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    this.advanceTurn(room);
  }

  public forceVote(roomId: string, hostPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'DRAWING') return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    this.startVotingPhase(room);
  }

  public kickPlayer(roomId: string, hostPlayerId: string, targetPlayerId: string) {
    const room = this.rooms.get(roomId);
    if (!room || hostPlayerId === targetPlayerId) return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    const target = room.players.get(targetPlayerId);
    if (!target) return;

    if (target.ws) {
      this.sendToClient(target.ws, { type: 'room_closed', reason: 'You were removed from the room by the host.' });
      target.ws.close();
    }

    room.players.delete(targetPlayerId);
    this.playerRoomMap.delete(targetPlayerId);

    // If target was current drawer
    if (room.currentDrawerId === targetPlayerId && room.phase === 'DRAWING') {
      this.advanceTurn(room);
    } else {
      this.syncRoomState(room);
    }
  }

  public updateSettings(roomId: string, hostPlayerId: string, newSettings: Partial<RoomSettings>) {
    const room = this.rooms.get(roomId);
    if (!room || room.phase !== 'LOBBY') return;
    const host = room.players.get(hostPlayerId);
    if (!host || !host.isHost) return;

    room.settings = {
      ...room.settings,
      ...newSettings,
    };

    this.syncRoomState(room);
  }

  public closeRoom(roomId: string, reason: string = 'Room closed by host.') {
    const room = this.rooms.get(roomId);
    if (!room) return;

    this.clearPhaseTimer(room);

    this.broadcastToRoom(room, {
      type: 'room_closed',
      reason,
    });

    for (const player of room.players.values()) {
      if (player.ws) {
        try { player.ws.close(); } catch (_) {}
      }
      this.playerRoomMap.delete(player.id);
    }

    this.rooms.delete(room.roomId);
    this.rooms.delete(room.roomCode);
  }

  // TIMER UTILITIES
  private setPhaseTimer(room: InternalRoom, seconds: number, callback: () => void) {
    this.clearPhaseTimer(room);
    room.phaseDeadline = Date.now() + seconds * 1000;
    room.timer = setTimeout(() => {
      callback();
    }, seconds * 1000);
  }

  private clearPhaseTimer(room: InternalRoom) {
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
  }

  // SYNC & BROADCAST
  public syncRoomState(room: InternalRoom) {
    const publicState = this.toPublicRoomState(room);

    for (const player of room.players.values()) {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        const privateInfo: ClientPrivateInfo = {
          playerId: player.id,
          role: player.role,
          // CRITICAL SECURITY: Never send secret word to Imposter!
          secretWord: player.role === 'IMPOSTER' ? null : room.secretWord || null,
        };

        this.sendToClient(player.ws, {
          type: 'sync_state',
          state: publicState,
          privateInfo,
        });
      }
    }
  }

  private toPublicRoomState(room: InternalRoom): PublicRoomState {
    return {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      phase: room.phase,
      phaseDeadline: room.phaseDeadline,
      isPaused: room.isPaused,
      pausedTimeRemaining: room.pausedTimeRemaining,
      settings: { ...room.settings },
      players: Array.from(room.players.values()).map(p => this.toPublicPlayer(p)),
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      currentDrawerId: room.currentDrawerId,
      turnOrder: [...room.turnOrder],
      strokes: room.strokes,
      chatMessages: room.chatMessages || [],
      lastVoteResult: room.lastVoteResult,
      winner: room.winner,
      revealedImposters: room.revealedImposters,
      revealedSecretWord: room.revealedSecretWord,
      imposterGuessResult: room.imposterGuessResult,
      createdAt: room.createdAt,
    };
  }

  private toPublicPlayer(p: InternalPlayer): PlayerPublicInfo {
    return {
      id: p.id,
      userId: p.userId,
      username: p.username,
      avatar: p.avatar,
      isHost: p.isHost,
      isConnected: p.isConnected,
      isEliminated: p.isEliminated,
      hasVoted: p.hasVoted,
      isReady: p.isReady,
    };
  }

  // CHAT SYSTEM
  public sendChatMessage(roomId: string, playerId: string, text: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player || !player.isConnected) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    // Security: sanitize and apply reasonable length limit (max 300 characters)
    const sanitized = trimmed
      .slice(0, 300)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const message: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      roomId: room.roomId,
      senderId: player.id,
      senderName: player.username,
      senderAvatar: player.avatar,
      text: sanitized,
      timestamp: Date.now(),
    };

    if (!room.chatMessages) {
      room.chatMessages = [];
    }
    room.chatMessages.push(message);

    // Keep memory clean: cap chat history to last 100 messages per room
    if (room.chatMessages.length > 100) {
      room.chatMessages.shift();
    }

    this.broadcastToRoom(room, {
      type: 'chat_message',
      message,
    });
  }

  // REAL-TIME VOICE CHAT SIGNALING
  public sendVoiceSignal(roomId: string, fromPlayerId: string, toPlayerId: string, signal: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const sender = room.players.get(fromPlayerId);
    const target = room.players.get(toPlayerId);

    // Validate room membership
    if (!sender || !target || !target.ws || target.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.sendToClient(target.ws, {
      type: 'voice_signal',
      fromPlayerId,
      signal,
    });
  }

  public updateVoiceStatus(
    roomId: string,
    playerId: string,
    isMuted: boolean,
    isSpeaking: boolean,
    isJoinedVoice: boolean
  ) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (!room.voiceParticipants) {
      room.voiceParticipants = new Map();
    }

    if (isJoinedVoice) {
      room.voiceParticipants.set(playerId, { isMuted, isSpeaking });
    } else {
      room.voiceParticipants.delete(playerId);
    }

    this.broadcastToRoom(room, {
      type: 'voice_status_update',
      playerId,
      isMuted,
      isSpeaking,
      isJoinedVoice,
    });
  }

  public broadcastToRoom(room: InternalRoom, message: ServerToClientMessage) {
    for (const player of room.players.values()) {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(player.ws, message);
      }
    }
  }

  private sendToClient(ws: WebSocket, message: ServerToClientMessage) {
    try {
      ws.send(JSON.stringify(message));
    } catch (err) {
      console.error('[WS] Send error:', err);
    }
  }
}

export const gameManager = new GameManager();

