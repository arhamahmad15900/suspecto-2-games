import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Paintbrush,
  PaintBucket,
  Eraser,
  Undo2,
  Trash2,
  Send,
  Clock,
  Pause,
  Play,
  SkipForward,
  Vote,
  Sparkles,
  Wifi,
  WifiOff,
  DoorOpen,
  MessageSquare,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { DrawingPoint, DrawingStroke } from '../types/game.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { VoiceControls } from './VoiceControls.js';
import { sounds } from '../services/sound.js';

const COLORS = [
  '#F8FAFC', // Crisp White
  '#94A3B8', // Slate Gray
  '#0F172A', // Deep Charcoal
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#78350F', // Brown
];

const BRUSH_SIZES = [
  { size: 3, label: 'Fine' },
  { size: 7, label: 'Medium' },
  { size: 14, label: 'Bold' },
  { size: 24, label: 'Marker' },
];

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

function colorMatch(
  r1: number, g1: number, b1: number, a1: number,
  r2: number, g2: number, b2: number, a2: number,
  tolerance: number = 32
): boolean {
  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance &&
    Math.abs(a1 - a2) <= tolerance
  );
}

function performFloodFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColorHex: string
) {
  const x0 = Math.round(startX);
  const y0 = Math.round(startY);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const startIndex = (y0 * width + x0) * 4;
  const startR = data[startIndex];
  const startG = data[startIndex + 1];
  const startB = data[startIndex + 2];
  const startA = data[startIndex + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColorHex);

  if (colorMatch(startR, startG, startB, startA, fillR, fillG, fillB, fillA, 5)) {
    return;
  }

  const visited = new Uint8Array(width * height);
  const queue: number[] = [x0 + y0 * width];
  visited[x0 + y0 * width] = 1;

  let head = 0;
  while (head < queue.length) {
    const pos = queue[head++];
    const x = pos % width;
    const y = Math.floor(pos / width);

    const idx = (y * width + x) * 4;
    data[idx] = fillR;
    data[idx + 1] = fillG;
    data[idx + 2] = fillB;
    data[idx + 3] = fillA;

    // 4-way neighbors
    const neighbors = [
      x > 0 ? pos - 1 : -1,
      x < width - 1 ? pos + 1 : -1,
      y > 0 ? pos - width : -1,
      y < height - 1 ? pos + width : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const nIdx = n * 4;
        if (
          colorMatch(
            data[nIdx],
            data[nIdx + 1],
            data[nIdx + 2],
            data[nIdx + 3],
            startR,
            startG,
            startB,
            startA,
            36
          )
        ) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export const DrawingCanvas: React.FC = () => {
  const {
    roomState,
    privateInfo,
    strokes,
    isMyTurn,
    timeRemainingSeconds,
    connectionStatus,
    sendStroke,
    clearCanvas,
    undoStroke,
    submitTurn,
    leaveRoom,
    amIHost,
    hostTogglePause,
    hostSkipTurn,
    hostForceVote,
    unreadChatCount,
    toggleChat,
  } = useGame();

  const { effectiveProfile } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drawing tool state
  const [selectedTool, setSelectedTool] = useState<'brush' | 'fill' | 'eraser'>('brush');
  const [selectedColor, setSelectedColor] = useState('#F97316'); // Warm Orange default
  const [brushSize, setBrushSize] = useState(7);

  // Active stroke being drawn right now
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<DrawingPoint[]>([]);

  // Redraw canvas whenever strokes change or window resizes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0B0C0E'; // Deep warm charcoal canvas background
    ctx.fillRect(0, 0, width, height);

    // Subtle guide grid lines
    ctx.strokeStyle = 'rgba(244, 244, 238, 0.03)';
    ctx.lineWidth = 1;
    const step = Math.min(width, height) / 10;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw all strokes in chronological sequence
    for (const stroke of strokes) {
      if (stroke.isFill && stroke.fillPoint) {
        performFloodFill(
          ctx,
          width,
          height,
          stroke.fillPoint.x * width,
          stroke.fillPoint.y * height,
          stroke.color
        );
      } else if (stroke.points && stroke.points.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = stroke.isEraser ? '#0B0C0E' : stroke.color;
        // Scale stroke size relative to canvas width
        const scale = width / 800;
        ctx.lineWidth = Math.max(1, stroke.size * scale);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const first = stroke.points[0];
        ctx.moveTo(first.x * width, first.y * height);

        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * width, pt.y * height);
        }
        ctx.stroke();
      }
    }
  }, [strokes]);

  // Resize canvas according to container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Set physical canvas pixel dimensions
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      redrawCanvas();
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    handleResize();

    return () => ro.disconnect();
  }, [redrawCanvas]);

  // Pointer event helpers
  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || roomState?.isPaused) return;

    e.preventDefault();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    const pt = getNormalizedPoint(e);

    // If Fill Bucket tool is active
    if (selectedTool === 'fill') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          performFloodFill(ctx, canvas.width, canvas.height, pt.x * canvas.width, pt.y * canvas.height, selectedColor);
        }
      }

      const fillStroke: DrawingStroke = {
        id: 'fill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        playerId: effectiveProfile.id,
        playerName: effectiveProfile.username,
        color: selectedColor,
        size: 1,
        isFill: true,
        fillPoint: pt,
        points: [pt],
      };

      sendStroke(fillStroke);
      sounds.playClick();
      return;
    }

    setIsDrawing(true);
    currentPointsRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMyTurn || roomState?.isPaused || selectedTool === 'fill') return;

    e.preventDefault();
    const pt = getNormalizedPoint(e);
    currentPointsRef.current.push(pt);

    // Live local preview stroke on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / 800;

    const pts = currentPointsRef.current;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];

      ctx.beginPath();
      ctx.strokeStyle = selectedTool === 'eraser' ? '#0B0C0E' : selectedColor;
      ctx.lineWidth = Math.max(1, brushSize * scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMyTurn || selectedTool === 'fill') return;

    e.preventDefault();
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    setIsDrawing(false);

    if (currentPointsRef.current.length > 1) {
      const newStroke: DrawingStroke = {
        id: 'stk_' + Math.random().toString(36).substring(2, 9),
        playerId: effectiveProfile.id,
        playerName: effectiveProfile.username,
        color: selectedColor,
        size: brushSize,
        isEraser: selectedTool === 'eraser',
        points: [...currentPointsRef.current],
      };
      sendStroke(newStroke);
    }
    currentPointsRef.current = [];
  };

  if (!roomState) return null;

  const currentDrawer = roomState.players.find((p) => p.id === roomState.currentDrawerId);
  const isImposter = privateInfo?.role === 'IMPOSTER';

  // Queue of upcoming drawers
  const currentIdx = roomState.turnOrder.indexOf(roomState.currentDrawerId || '');

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-200">
      {/* Top HUD */}
      <div className="p-3 sm:p-4 bg-[#181C24] border border-[#28303F] rounded-xl shadow-xs mb-3 flex flex-wrap items-center justify-between gap-3">
        {/* Secret Word Badge / Secret Alert */}
        <div className="flex items-center gap-2.5">
          {isImposter ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E63946]/10 border border-[#E63946]/30 rounded-lg text-[#FF9AA2] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#E63946]" />
              <span>You are the Imposter. Blend in and deduce the word.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1217] border border-[#28303F] rounded-lg text-xs">
              <span className="text-[#9AA0AD]">Secret Word:</span>
              <span className="font-display font-bold text-[#E6E8EC] text-sm tracking-wide">
                {privateInfo?.secretWord}
              </span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#9AA0AD] font-mono">
            <span>Round</span>
            <span className="font-bold text-[#E6E8EC]">
              {roomState.currentRound} / {roomState.totalRounds}
            </span>
          </div>
        </div>

        {/* Turn Status & Real-Time Audio / Chat Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <VoiceControls />

          <button
            onClick={() => toggleChat()}
            aria-label="Open Room Chat"
            title="Open Room Chat"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1217] hover:bg-[#202632] border border-[#28303F] text-xs font-semibold text-[#9AA0AD] hover:text-[#E6E8EC] transition-colors cursor-pointer"
          >
            <MessageSquare size={14} className="text-[#FFB800]" />
            <span className="hidden sm:inline">Chat</span>
            {unreadChatCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#FFB800] text-[#0F1217] text-[10px] font-bold">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold border transition-colors ${
              timeRemainingSeconds <= 5
                ? 'bg-[#E63946]/20 text-[#FF9AA2] border-[#E63946]/50'
                : 'bg-[#0F1217] text-[#FFB800] border-[#28303F]'
            }`}
          >
            <Clock size={15} />
            <span>{timeRemainingSeconds}s</span>
          </div>

          {/* Leave Game Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to leave the active match?')) {
                leaveRoom();
              }
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#0F1217] hover:bg-[#E63946]/20 text-[#9AA0AD] hover:text-[#E63946] border border-[#28303F] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Leave Match"
          >
            <DoorOpen size={14} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Area & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Canvas Surface Container */}
        <div className="lg:col-span-9 flex flex-col">
          <div
            ref={containerRef}
            className={`relative w-full aspect-[4/3] max-h-[65vh] bg-[#0F1217] border-2 rounded-xl overflow-hidden shadow-sm transition-colors ${
              isMyTurn
                ? selectedTool === 'fill'
                  ? 'border-[#FFB800] cursor-cell'
                  : 'border-[#FFB800] cursor-crosshair'
                : 'border-[#28303F] cursor-default'
            }`}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-full canvas-touch-none block"
            />

            {/* Waiting Overlay when not player's turn */}
            {!isMyTurn && (
              <div className="absolute top-3 left-3 pointer-events-none bg-[#0F1217]/90 px-2.5 py-1 rounded-md border border-[#28303F] text-[11px] text-[#E6E8EC] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
                <span>Live View · {currentDrawer ? `${currentDrawer.username} is drawing` : 'Waiting...'}</span>
              </div>
            )}

            {/* Paused Banner */}
            {roomState.isPaused && (
              <div className="absolute inset-0 bg-[#0F1217]/90 flex flex-col items-center justify-center p-6 text-center z-10">
                <Pause size={32} className="text-[#FFB800] mb-2" />
                <h3 className="font-display text-lg font-bold text-[#E6E8EC]">Match Paused</h3>
                <p className="text-xs text-[#9AA0AD] mt-1">
                  The host has paused the match timer.
                </p>
              </div>
            )}
          </div>

          {/* Active Drawer Toolbar */}
          {isMyTurn ? (
            <div className="mt-3 p-3 bg-[#181C24] border border-[#28303F] rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
              {/* Color Palette */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedColor(c);
                      if (selectedTool === 'eraser') {
                        setSelectedTool('brush');
                      }
                      sounds.playClick();
                    }}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                    className={`w-7 h-7 rounded-md border transition-transform cursor-pointer shrink-0 ${
                      selectedTool !== 'eraser' && selectedColor === c
                        ? 'scale-105 border-white ring-2 ring-[#FFB800]'
                        : 'border-[#28303F] hover:scale-105'
                    }`}
                  />
                ))}
              </div>

              {/* Tools & Brush Sizes */}
              <div className="flex items-center gap-2">
                {/* Tool Selector */}
                <div className="flex items-center gap-1 bg-[#0F1217] p-1 rounded-lg border border-[#28303F]">
                  <button
                    onClick={() => {
                      setSelectedTool('brush');
                      sounds.playClick();
                    }}
                    aria-label="Brush Tool"
                    title="Brush Tool"
                    className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      selectedTool === 'brush'
                        ? 'bg-[#FFB800] text-[#0F1217] font-bold'
                        : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
                    }`}
                  >
                    <Paintbrush size={14} />
                    <span className="hidden sm:inline">Brush</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTool('fill');
                      sounds.playClick();
                    }}
                    aria-label="Fill Bucket Tool"
                    title="Fill Bucket (Flood fill shape)"
                    className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      selectedTool === 'fill'
                        ? 'bg-[#FFB800] text-[#0F1217] font-bold'
                        : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
                    }`}
                  >
                    <PaintBucket size={14} />
                    <span className="hidden sm:inline">Fill Bucket</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTool('eraser');
                      sounds.playClick();
                    }}
                    aria-label="Eraser Tool"
                    title="Eraser Tool"
                    className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      selectedTool === 'eraser'
                        ? 'bg-[#FFB800] text-[#0F1217] font-bold'
                        : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
                    }`}
                  >
                    <Eraser size={14} />
                    <span className="hidden sm:inline">Eraser</span>
                  </button>
                </div>

                {/* Brush Sizes */}
                {selectedTool !== 'fill' && (
                  <div className="flex items-center gap-1 bg-[#0F1217] p-1 rounded-lg border border-[#28303F]">
                    {BRUSH_SIZES.map((b) => (
                      <button
                        key={b.size}
                        onClick={() => {
                          setBrushSize(b.size);
                          sounds.playClick();
                        }}
                        className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                          brushSize === b.size
                            ? 'bg-[#202632] text-[#FFB800] font-bold border border-[#28303F]'
                            : 'text-[#9AA0AD] hover:text-[#E6E8EC]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Undo */}
                <button
                  onClick={undoStroke}
                  className="p-2 bg-[#0F1217] hover:bg-[#202632] text-[#9AA0AD] hover:text-[#E6E8EC] border border-[#28303F] rounded-lg transition-colors cursor-pointer"
                  title="Undo last stroke or fill"
                  aria-label="Undo action"
                >
                  <Undo2 size={15} />
                </button>

                {/* Clear */}
                <button
                  onClick={() => {
                    if (window.confirm('Clear your entire drawing?')) {
                      clearCanvas();
                    }
                  }}
                  className="p-2 bg-[#0F1217] hover:bg-[#202632] text-[#9AA0AD] hover:text-[#E63946] border border-[#28303F] rounded-lg transition-colors cursor-pointer"
                  title="Clear canvas"
                  aria-label="Clear canvas"
                >
                  <Trash2 size={15} />
                </button>

                {/* Submit Turn */}
                <button
                  onClick={submitTurn}
                  className="px-3.5 py-2 bg-[#FFB800] hover:bg-[#FFC425] active:bg-[#E5A600] text-[#0F1217] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                >
                  <Send size={14} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-[#181C24] border border-[#28303F] rounded-xl flex items-center justify-between text-xs text-[#9AA0AD]">
              <span>Observing strokes in real time. Prepare your deduction.</span>
              <span className="font-mono text-[#FFB800] font-bold">
                {strokes.length} stroke{strokes.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar: Queue & Host Controls */}
        <div className="lg:col-span-3 space-y-3">
          {/* Upcoming Drawers Queue */}
          <div className="p-4 bg-[#181C24] border border-[#28303F] rounded-xl">
            <h4 className="text-xs uppercase tracking-wider text-[#9AA0AD] font-bold mb-3">
              Turn Order
            </h4>
            <div className="space-y-2">
              {roomState.turnOrder.map((id, index) => {
                const p = roomState.players.find((player) => player.id === id);
                if (!p) return null;
                const isCurrent = id === roomState.currentDrawerId;
                const isDone = index < currentIdx;

                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-[#FFB800]/10 border border-[#FFB800]/40 text-[#FFB800] font-semibold'
                        : isDone
                        ? 'bg-[#0F1217]/50 text-[#5E6573]'
                        : 'bg-[#0F1217] text-[#E6E8EC] border border-[#28303F]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AvatarDisplay avatarId={p.avatar} size="sm" showBorder={false} />
                      <span className="truncate max-w-[100px]">{p.username}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold">
                      {isCurrent ? 'Drawing' : isDone ? 'Done' : 'Up next'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Host Controls Panel */}
          {amIHost && (
            <div className="p-4 bg-[#181C24] border border-[#28303F] rounded-xl space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#9AA0AD] font-bold block mb-1">
                Host Moderation
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={hostTogglePause}
                  className="py-2 px-3 bg-[#0F1217] hover:bg-[#202632] text-[#E6E8EC] border border-[#28303F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {roomState.isPaused ? <Play size={14} className="text-[#FFB800]" /> : <Pause size={14} className="text-[#FFB800]" />}
                  <span>{roomState.isPaused ? 'Resume' : 'Pause'}</span>
                </button>

                <button
                  onClick={hostSkipTurn}
                  className="py-2 px-3 bg-[#0F1217] hover:bg-[#202632] text-[#E6E8EC] border border-[#28303F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <SkipForward size={14} />
                  <span>Skip Turn</span>
                </button>
              </div>

              <button
                onClick={hostForceVote}
                className="w-full py-2 px-3 bg-[#0F1217] hover:bg-[#202632] text-[#FFB800] border border-[#28303F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Vote size={14} />
                <span>Force Advance to Vote</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
