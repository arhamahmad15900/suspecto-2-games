import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush, PaintBucket, Eraser, Undo2, Trash2,
  Send, Clock, DoorOpen, Trophy,
} from 'lucide-react';
import { useSketchio } from '../../context/SketchioContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { DrawingPoint, DrawingStroke } from '../../types/game.js';
import { AvatarDisplay } from '../AvatarDisplay.js';
import { sounds } from '../../services/sound.js';

/* ── Colours & sizes (same as Picto's DrawingCanvas for consistency) ── */
const COLORS = [
  '#F8FAFC', '#94A3B8', '#0F172A', '#EF4444', '#F97316',
  '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#78350F',
];
const BRUSH_SIZES = [{ size: 3 }, { size: 7 }, { size: 14 }, { size: 24 }];

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
function colorMatch(r1: number, g1: number, b1: number, a1: number,
                    r2: number, g2: number, b2: number, a2: number, tol = 32) {
  return Math.abs(r1 - r2) <= tol && Math.abs(g1 - g2) <= tol &&
         Math.abs(b1 - b2) <= tol && Math.abs(a1 - a2) <= tol;
}
function floodFill(ctx: CanvasRenderingContext2D, w: number, h: number,
                   sx: number, sy: number, fillHex: string) {
  const x0 = Math.round(sx), y0 = Math.round(sy);
  if (x0 < 0 || x0 >= w || y0 < 0 || y0 >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const si = (y0 * w + x0) * 4;
  const [sr, sg, sb, sa] = [d[si], d[si + 1], d[si + 2], d[si + 3]];
  const [fr, fg, fb, fa] = hexToRgba(fillHex);
  if (colorMatch(sr, sg, sb, sa, fr, fg, fb, fa, 5)) return;
  const vis = new Uint8Array(w * h);
  const queue = [x0 + y0 * w];
  vis[x0 + y0 * w] = 1;
  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % w, y = Math.floor(pos / w);
    const idx = (y * w + x) * 4;
    d[idx] = fr; d[idx + 1] = fg; d[idx + 2] = fb; d[idx + 3] = fa;
    for (const n of [x > 0 ? pos - 1 : -1, x < w - 1 ? pos + 1 : -1,
                     y > 0 ? pos - w : -1, y < h - 1 ? pos + w : -1]) {
      if (n !== -1 && !vis[n]) {
        const ni = n * 4;
        if (colorMatch(d[ni], d[ni + 1], d[ni + 2], d[ni + 3], sr, sg, sb, sa, 36)) {
          vis[n] = 1; queue.push(n);
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/* ════════════════════════════════════════════════════════════════ */
export const SketchioDrawingView: React.FC = () => {
  const {
    skRoomState, skPrivateInfo, skStrokes, skTimeRemaining, skCloseGuess,
    skAmIDrawer, skMyPlayer,
    skSendStroke, skClearCanvas, skUndoStroke, skLeave, skSendGuess,
  } = useSketchio();
  const { effectiveProfile, user } = useAuth();

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointsRef    = useRef<DrawingPoint[]>([]);

  const [tool, setTool]   = useState<'brush' | 'fill' | 'eraser'>('brush');
  const [color, setColor] = useState('#F97316');
  const [size, setSize]   = useState(7);
  const [drawing, setDrawing] = useState(false);
  const [guess, setGuess] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [skRoomState?.chatMessages.length]);

  /* ── Canvas redraw ─────────────────────────────────────── */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    ctx.fillStyle = '#0B0C0E';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const step = Math.min(w, h) / 10;
    for (let x = step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (const s of skStrokes) {
      if (s.isFill && s.fillPoint) {
        floodFill(ctx, w, h, s.fillPoint.x * w, s.fillPoint.y * h, s.color);
      } else if (s.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = s.isEraser ? '#0B0C0E' : s.color;
        ctx.lineWidth = Math.max(1, s.size * (w / 800));
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.moveTo(s.points[0].x * w, s.points[0].y * h);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x * w, s.points[i].y * h);
        ctx.stroke();
      }
    }
  }, [skStrokes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      redraw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  /* ── Pointer events ────────────────────────────────────── */
  const pt = (e: React.PointerEvent<HTMLCanvasElement>): DrawingPoint => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height)),
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!skAmIDrawer) return;
    e.preventDefault();
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (_) {}
    const p = pt(e);
    if (tool === 'fill') {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      floodFill(ctx, canvas.width, canvas.height, p.x * canvas.width, p.y * canvas.height, color);
      skSendStroke({ id: 'fill_' + Date.now(), playerId: user?.id ?? effectiveProfile.id, playerName: effectiveProfile.username, color, size: 1, isFill: true, fillPoint: p, points: [p] });
      sounds.playClick();
      return;
    }
    setDrawing(true);
    pointsRef.current = [p];
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !skAmIDrawer || tool === 'fill') return;
    e.preventDefault();
    const p = pt(e);
    pointsRef.current.push(p);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pts = pointsRef.current;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2], p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#0B0C0E' : color;
      ctx.lineWidth = Math.max(1, size * (canvas.width / 800));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x  * canvas.width, p2.y  * canvas.height);
      ctx.stroke();
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !skAmIDrawer || tool === 'fill') return;
    e.preventDefault();
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) {}
    setDrawing(false);
    if (pointsRef.current.length > 1) {
      skSendStroke({
        id: 'stk_' + Math.random().toString(36).slice(2, 9),
        playerId: user?.id ?? effectiveProfile.id,
        playerName: effectiveProfile.username,
        color, size,
        isEraser: tool === 'eraser',
        points: [...pointsRef.current],
      });
    }
    pointsRef.current = [];
  };

  if (!skRoomState) return null;
  const myId     = user?.id ?? effectiveProfile.id;
  const sortedPlayers = [...skRoomState.players].sort((a, b) => b.score - a.score);
  const alreadyGuessed = skMyPlayer?.hasGuessedThisRound ?? false;
  const drawerName = skRoomState.players.find(p => p.id === skRoomState.currentDrawerId)?.username ?? '?';

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || alreadyGuessed || skAmIDrawer) return;
    skSendGuess(guess.trim());
    setGuess('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 animate-in fade-in duration-200">
      {/* Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 px-1">
        {/* Hint / word display */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {skAmIDrawer && skPrivateInfo?.currentWord ? (
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-[#22D3EE]/10 border border-[#22D3EE]/30 rounded-lg">
              <span className="text-[10px] sm:text-xs text-[#9AA0AD]">Drawing:</span>
              <span className="font-display font-black text-[#22D3EE] text-xs sm:text-sm tracking-widest">
                {skPrivateInfo.currentWord}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-[#0F1217] border border-[#28303F] rounded-lg">
              <span className="text-[10px] sm:text-xs text-[#9AA0AD]">{drawerName} is drawing:</span>
              <span className="font-display font-black text-white text-xs sm:text-sm tracking-[0.25em]">
                {skRoomState.hint || '_ _ _'}
              </span>
              <span className="text-[10px] sm:text-xs text-[#475569] font-mono">({skRoomState.wordLength} letters)</span>
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#9AA0AD] font-mono">
            <span>Round</span>
            <span className="font-bold text-white">{skRoomState.currentRound}/{skRoomState.totalRounds}</span>
          </div>
        </div>

        {/* Timer + leave */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold border ${
            skTimeRemaining <= 10 ? 'bg-[#EF4444]/15 text-[#FF9AA2] border-[#EF4444]/40' : 'bg-[#0F1217] text-[#22D3EE] border-[#28303F]'
          }`}>
            <Clock size={12} />{skTimeRemaining}s
          </div>
          <button
            onClick={() => { if (window.confirm('Leave this game?')) skLeave(); }}
            className="p-2 rounded-xl bg-[#0F1217] hover:bg-[#EF4444]/15 text-[#9AA0AD] hover:text-[#EF4444] border border-[#28303F] transition-colors cursor-pointer"
            aria-label="Leave game"
          >
            <DoorOpen size={14} />
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
        {/* Canvas + toolbar */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          {/* Drawing tools (drawer only) */}
          {skAmIDrawer && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 bg-[#111218] border border-[#28303F] rounded-xl">
              {/* Tool buttons */}
              <div className="flex items-center gap-1">
                {[
                  { t: 'brush' as const, icon: <Paintbrush size={14} /> },
                  { t: 'fill'  as const, icon: <PaintBucket size={14} /> },
                  { t: 'eraser' as const, icon: <Eraser size={14} /> },
                ].map(({ t, icon }) => (
                  <button key={t} onClick={() => setTool(t)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${tool === t ? 'bg-[#22D3EE]/20 border-[#22D3EE]/50 text-[#22D3EE]' : 'bg-[#0F1217] border-[#28303F] text-[#9AA0AD] hover:text-white'}`}
                    aria-label={`Select ${t} tool`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-[#28303F]" />
              {/* Brush sizes */}
              <div className="flex items-center gap-1">
                {BRUSH_SIZES.map(bs => (
                  <button key={bs.size} onClick={() => setSize(bs.size)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${size === bs.size ? 'border-[#22D3EE]/50 bg-[#22D3EE]/15' : 'border-[#28303F] bg-[#0F1217] hover:border-[#22D3EE]/30'}`}
                    aria-label={`Brush size ${bs.size}`}
                  >
                    <div className="rounded-full bg-current" style={{ width: Math.min(bs.size, 14), height: Math.min(bs.size, 14), background: size === bs.size ? '#22D3EE' : '#9AA0AD' }} />
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-[#28303F]" />
              {/* Colors */}
              <div className="flex items-center gap-1 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 transition-all cursor-pointer ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <label
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-white/20 overflow-hidden cursor-pointer relative"
                  title="Custom color"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span
                    className="block w-full h-full"
                    style={{ background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)` }}
                  />
                </label>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={() => { sounds.playClick(); skUndoStroke(); }}
                  className="p-2 rounded-lg border border-[#28303F] bg-[#0F1217] text-[#9AA0AD] hover:text-white transition-colors cursor-pointer"
                  aria-label="Undo"
                >
                  <Undo2 size={13} />
                </button>
                <button onClick={() => { sounds.playClick(); skClearCanvas(); }}
                  className="p-2 rounded-lg border border-[#28303F] bg-[#0F1217] text-[#9AA0AD] hover:text-[#EF4444] transition-colors cursor-pointer"
                  aria-label="Clear canvas"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div
            ref={containerRef}
            className={`relative w-full aspect-[4/3] max-h-[50vh] sm:max-h-[60vh] bg-[#0B0C0E] rounded-xl overflow-hidden border-2 transition-colors ${
              skAmIDrawer
                ? tool === 'fill' ? 'border-[#22D3EE] cursor-cell' : 'border-[#22D3EE] cursor-crosshair'
                : 'border-[#28303F] cursor-default'
            }`}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
            {!skAmIDrawer && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-[#9AA0AD] border border-white/10">
                👀 Watching {drawerName} draw
              </div>
            )}
            {skCloseGuess && !skAmIDrawer && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-2 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/40 text-[#F5A623] text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_24px_rgba(245,166,35,0.25)]">
                "{skCloseGuess}" is close!
              </div>
            )}
          </div>

          {/* Guess input (non-drawer only) */}
          {!skAmIDrawer && (
            <form onSubmit={handleGuessSubmit} className="flex gap-2">
              <input
                type="text"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                disabled={alreadyGuessed}
                placeholder={alreadyGuessed ? '✅ You guessed correctly!' : 'Type your guess…'}
                className="flex-1 px-3 sm:px-4 py-3 rounded-xl bg-[#111218] border border-[#28303F] focus:border-[#22D3EE]/60 text-sm text-white placeholder:text-[#2A3045] focus:outline-none transition-colors disabled:opacity-50"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={alreadyGuessed || !guess.trim()}
                className="px-4 sm:px-5 py-3 rounded-xl font-bold text-sm bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-[#22D3EE] hover:bg-[#22D3EE]/25 disabled:opacity-30 transition-colors cursor-pointer"
                aria-label="Submit guess"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Right panel: scoreboard + chat */}
        <div className="lg:col-span-4 flex flex-col gap-2 sm:gap-3 min-h-0">
          {/* Scoreboard */}
          <div className="glass rounded-xl p-2 sm:p-3">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-[#9AA0AD]">
              <Trophy size={12} className="text-[#F5A623]" />
              Scoreboard
            </div>
            <div className="space-y-1.5 max-h-32 sm:max-h-40 overflow-y-auto">
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-2 px-2 sm:px-2.5 py-2 rounded-lg ${p.id === myId ? 'bg-[#22D3EE]/8 border border-[#22D3EE]/20' : 'bg-[#0F1217]'}`}>
                  <span className="font-mono text-[10px] text-[#475569] w-3">{i + 1}</span>
                  <AvatarDisplay avatarId={p.avatar} size="xs" showBorder={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-[#E6E8EC] truncate">{p.username}</span>
                      {p.id === skRoomState.currentDrawerId && <span className="text-[8px] text-[#22D3EE]">✏️</span>}
                      {p.hasGuessedThisRound && <span className="text-[8px] text-emerald-400">✓</span>}
                    </div>
                  </div>
                  <span className="font-display font-bold text-xs text-[#F5A623]">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat / guess feed */}
          <div className="glass rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-2 sm:px-3 py-2 border-b border-[#28303F] text-[10px] font-mono text-[#475569] uppercase tracking-widest">
              Chat & Guesses
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-[150px] sm:min-h-[180px] max-h-[300px] sm:max-h-[340px]">
              {skRoomState.chatMessages.slice(-40).map(msg => (
                <div key={msg.id} className={`text-xs px-2.5 py-1.5 rounded-lg ${
                  msg.isSystem
                    ? 'text-[#22D3EE] bg-[#22D3EE]/6 border border-[#22D3EE]/15 font-mono'
                    : msg.isCorrectGuess
                      ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 font-semibold'
                      : 'text-[#9AA0AD]'
                }`}>
                  {!msg.isSystem && (
                    <span className="font-semibold text-[#E6E8EC] mr-1">{msg.senderName}:</span>
                  )}
                  {msg.text}
                </div>
              ))}
              {skRoomState.chatMessages.length === 0 && (
                <p className="text-xs text-[#2A3045] text-center mt-4 font-mono">Chat will appear here…</p>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
