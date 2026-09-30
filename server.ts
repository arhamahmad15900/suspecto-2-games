import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { gameManager } from './server/gameManager.js';
import { sketchioManager } from './server/sketchioManager.js';
import { ClientToServerMessage, SketchioClientMessage } from './src/types/game.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Track client sockets
const socketPlayerMap = new WeakMap<WebSocket, { playerId: string; roomId: string }>();

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (data: string) => {
    try {
      const message = JSON.parse(data.toString()) as ClientToServerMessage;

      switch (message.type) {
        case 'join_room': {
          if (!message.authToken) {
            ws.send(JSON.stringify({
              type: 'error_message',
              message: 'You must be logged in to join a game room. Please sign in or register.'
            }));
            return;
          }
          const user = db.getUserByToken(message.authToken);
          if (!user) {
            ws.send(JSON.stringify({
              type: 'error_message',
              message: 'Authentication session expired or invalid. Please sign in to join.'
            }));
            return;
          }

          try {
            const { room } = gameManager.joinRoom(
              message.roomId,
              {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                userId: user.id,
              },
              ws
            );
            socketPlayerMap.set(ws, { playerId: user.id, roomId: room.roomId });
            gameManager.syncRoomState(room);
          } catch (err: any) {
            ws.send(JSON.stringify({ type: 'error_message', message: err.message || 'Failed to join room' }));
          }
          break;
        }

        case 'ready_match': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.setPlayerReady(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'draw_stroke': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.addStroke(mapping.roomId, mapping.playerId, message.stroke);
          }
          break;
        }

        case 'clear_canvas': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.clearCanvas(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'undo_stroke': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.undoStroke(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'submit_turn': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.submitTurn(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'cast_vote': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.castVote(mapping.roomId, mapping.playerId, message.targetPlayerId);
          }
          break;
        }

        case 'submit_imposter_guess': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.submitImposterGuess(mapping.roomId, mapping.playerId, message.guess);
          }
          break;
        }

        case 'host_start_game': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            try {
              gameManager.startGame(mapping.roomId, mapping.playerId);
            } catch (err: any) {
              ws.send(JSON.stringify({ type: 'error_message', message: err.message || 'Could not start game' }));
            }
          }
          break;
        }

        case 'host_pause_toggle': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.togglePause(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'host_skip_turn': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.skipTurn(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'host_force_vote': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.forceVote(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'host_restart_game': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.restartGame(mapping.roomId, mapping.playerId);
          }
          break;
        }

        case 'host_kick_player': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.kickPlayer(mapping.roomId, mapping.playerId, message.targetPlayerId);
          }
          break;
        }

        case 'host_update_settings': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.updateSettings(mapping.roomId, mapping.playerId, message.settings);
          }
          break;
        }

        case 'host_close_room': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.closeRoom(mapping.roomId);
          }
          break;
        }

        case 'send_chat': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.sendChatMessage(mapping.roomId, mapping.playerId, message.text);
          }
          break;
        }

        case 'voice_signal': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.sendVoiceSignal(mapping.roomId, mapping.playerId, message.toPlayerId, message.signal);
          }
          break;
        }

        case 'voice_status': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.updateVoiceStatus(
              mapping.roomId,
              mapping.playerId,
              message.isMuted,
              message.isSpeaking,
              message.isJoinedVoice
            );
          }
          break;
        }

        case 'leave_room': {
          const mapping = socketPlayerMap.get(ws);
          if (mapping) {
            gameManager.leaveRoom(mapping.roomId, mapping.playerId);
            socketPlayerMap.delete(ws);
          }
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }

      // ── Sketchio message routing ────────────────────────────
      const skMsg = message as unknown as SketchioClientMessage;
      if (typeof skMsg.type === 'string' && skMsg.type.startsWith('sk_')) {
        switch (skMsg.type) {
          case 'sk_join': {
            if (!skMsg.authToken) {
              ws.send(JSON.stringify({ type: 'error_message', message: 'You must be signed in to join a Sketchio room.' }));
              return;
            }
            const user = db.getUserByToken(skMsg.authToken);
            if (!user) {
              ws.send(JSON.stringify({ type: 'error_message', message: 'Session expired. Please sign in again.' }));
              return;
            }
            try {
              const room = sketchioManager.joinRoom(
                skMsg.roomId,
                { id: user.id, username: user.username, avatar: user.avatar, userId: user.id },
                ws
              );
              socketPlayerMap.set(ws, { playerId: user.id, roomId: room.roomId });
              sketchioManager.syncAll(room);
            } catch (err: any) {
              ws.send(JSON.stringify({ type: 'error_message', message: err.message || 'Failed to join Sketchio room.' }));
            }
            break;
          }
          case 'sk_start_game': {
            const m = socketPlayerMap.get(ws);
            if (m) {
              try { sketchioManager.startGame(m.roomId, m.playerId); }
              catch (err: any) { ws.send(JSON.stringify({ type: 'error_message', message: err.message })); }
            }
            break;
          }
          case 'sk_select_word': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.selectWord(m.roomId, m.playerId, skMsg.word);
            break;
          }
          case 'sk_guess': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.submitGuess(m.roomId, m.playerId, skMsg.text);
            break;
          }
          case 'sk_stroke': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.addStroke(m.roomId, m.playerId, skMsg.stroke);
            break;
          }
          case 'sk_clear': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.clearCanvas(m.roomId, m.playerId);
            break;
          }
          case 'sk_undo': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.undoStroke(m.roomId, m.playerId);
            break;
          }
          case 'sk_kick_player': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.kickPlayer(m.roomId, m.playerId, skMsg.targetPlayerId);
            break;
          }
          case 'sk_update_settings': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.updateSettings(m.roomId, m.playerId, skMsg.settings);
            break;
          }
          case 'sk_restart': {
            const m = socketPlayerMap.get(ws);
            if (m) sketchioManager.restartGame(m.roomId, m.playerId);
            break;
          }
          case 'sk_leave': {
            const m = socketPlayerMap.get(ws);
            if (m) { sketchioManager.leaveRoom(m.roomId, m.playerId); socketPlayerMap.delete(ws); }
            break;
          }
        }
      }
    } catch (err) {
      console.error('[WS] Message handling error:', err);
    }
  });

  ws.on('close', () => {
    const mapping = socketPlayerMap.get(ws);
    if (mapping) {
      gameManager.handleDisconnect(mapping.playerId);
      sketchioManager.handleDisconnect(mapping.playerId);
    }
  });
});

// REST API ROUTES
// Auth
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    const result = db.registerUser(username, email, password, avatar);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }
    const result = db.loginUser(emailOrUsername, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Login failed.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  res.json({ user });
});

app.post('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updated = db.updateProfile(user.id, req.body);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed.' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const result = db.requestPasswordReset(email);
  res.json(result);
});

app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  try {
    db.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Password reset failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    db.logoutUser(token);
  }
  res.json({ success: true });
});

// Rooms
app.post('/api/rooms/create', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'You must be logged in to host a game room. Please sign in or register.' });
    }
    const token = authHeader.substring(7);
    const user = db.getUserByToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Your session may have expired. Please log in.' });
    }

    const { settings } = req.body;
    const { roomId, roomCode } = gameManager.createRoom(
      user.id,
      user.username,
      user.avatar || 'detective',
      user.id,
      settings || {}
    );
    res.json({ roomId, roomCode });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create room.' });
  }
});

app.get('/api/rooms/:idOrCode', (req, res) => {
  const room = gameManager.getRoom(req.params.idOrCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  res.json({
    roomId: room.roomId,
    roomCode: room.roomCode,
    playersCount: room.players.size,
    maxPlayers: room.settings.maxPlayers,
    phase: room.phase,
    isPrivate: room.settings.isPrivate,
  });
});

app.get('/api/match-history', (_req, res) => {
  res.json({ matches: db.getMatchHistory() });
});

// Sketchio room creation
app.post('/api/sketchio/rooms/create', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sign in to create a Sketchio room.' });
    }
    const user = db.getUserByToken(authHeader.substring(7));
    if (!user) return res.status(401).json({ error: 'Session expired. Please sign in.' });

    const { settings } = req.body;
    const { roomId, roomCode } = sketchioManager.createRoom(
      user.id, user.username, user.avatar || 'detective', user.id, settings || {}
    );
    res.json({ roomId, roomCode });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create room.' });
  }
});

app.get('/api/sketchio/rooms/:idOrCode', (req, res) => {
  const room = sketchioManager.getRoom(req.params.idOrCode);
  if (!room) return res.status(404).json({ error: 'Room not found.' });
  res.json({
    roomId: room.roomId,
    roomCode: room.roomCode,
    playersCount: room.players.size,
    maxPlayers: room.settings.maxPlayers,
    phase: room.phase,
    isPrivate: room.settings.isPrivate,
  });
});

// Dev / Prod Vite serving
async function setupApp() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Game Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
