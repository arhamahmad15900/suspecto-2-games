/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Copy, Check, Share2, Crown, Users, Play, UserX,
  Zap, Clock, DoorOpen, MessageSquare,
} from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { VoiceControls } from './VoiceControls.js';

export const LobbyView: React.FC = () => {
  const {
    roomState, amIHost, hostStartGame, hostKickPlayer,
    hostCloseRoom, leaveRoom, toggleChat, unreadChatCount,
  } = useGame();
  const { effectiveProfile } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const codeRef      = useRef<HTMLSpanElement>(null);

  /* GSAP entrance */
  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.lobby-header', { opacity:0, y:-24, duration:0.6, ease:'power3.out', delay:0.05 });
      gsap.from('.player-card',  {
        opacity:0, y:32, scale:0.92, duration:0.55, ease:'back.out(1.5)',
        stagger:0.07, delay:0.18,
      });
      gsap.from('.lobby-footer', { opacity:0, y:20, duration:0.5, ease:'power2.out', delay:0.4 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  /* Pulse the room code on copy */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomState!.roomCode);
      setCopiedCode(true);
      if (codeRef.current) gsap.fromTo(codeRef.current, { scale:1.25 }, { scale:1, duration:0.4, ease:'elastic.out(1,0.5)' });
      setTimeout(() => setCopiedCode(false), 2200);
    } catch (_) {}
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?room=${roomState!.roomCode}`;
    if (navigator.share) { try { await navigator.share({ title:'Suspecto Invite', text:`Join room ${roomState!.roomCode}`, url }); return; } catch (_) {} }
    try { await navigator.clipboard.writeText(url); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2200); } catch (_) {}
  };

  if (!roomState) return null;

  const connected = roomState.players.filter(p => p.isConnected);
  const canStart  = connected.length >= 2;

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto px-4 py-10">

      {/* ── Header Banner ── */}
      <div className="lobby-header glass card-float rounded-2xl p-6 mb-6 glow-violet">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <span className="text-[11px] uppercase font-mono font-bold tracking-widest text-[#475569] block mb-2">
              Private Game Lobby
            </span>
            <div className="flex items-center gap-3">
              <span ref={codeRef} className="font-mono text-4xl sm:text-5xl font-black text-shimmer-gold tracking-[0.12em]">
                {roomState.roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 glass-gold rounded-xl text-[#F5A623] hover:glow-gold transition-all duration-300 cursor-pointer"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3.5 py-2.5 glass-gold rounded-xl text-[#F5A623] text-xs font-semibold hover:glow-gold transition-all duration-300 cursor-pointer"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Invite'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3 text-xs">
            <div className="flex items-center gap-2">
              <VoiceControls />
              <button
                onClick={() => toggleChat()}
                className="relative flex items-center gap-1.5 px-3 py-2 glass rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-all duration-300 cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#F5A623]" />
                <span>Chat</span>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#F5A623] text-[#04050A] text-[9px] font-black flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-4 font-mono text-[#475569]">
              <span className="flex items-center gap-1.5"><Users size={13} className="text-[#F5A623]" />{connected.length}/{roomState.settings.maxPlayers} Joined</span>
              <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#F5A623]" />{roomState.settings.drawingTimeSeconds}s · {roomState.settings.wordCategory}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Players Grid ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-base font-bold text-[#F8FAFC] flex items-center gap-2">
            Connected Players
            <span className="badge badge-gold">{connected.length}</span>
          </h3>
          <span className="text-xs text-[#475569]">Waiting for host to start…</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {roomState.players.map(p => {
            const isMe = p.id === effectiveProfile.id;
            return (
              <div
                key={p.id}
                className={`player-card relative p-4 rounded-2xl flex flex-col items-center text-center transition-all duration-350 ${
                  p.isConnected
                    ? isMe ? 'glass-gold card-float' : 'glass card-float'
                    : 'glass opacity-35'
                }`}
              >
                {p.isHost && (
                  <div className="absolute top-2.5 left-2.5 badge badge-gold">
                    <Crown size={10} /> HOST
                  </div>
                )}
                {amIHost && !p.isHost && (
                  <button
                    onClick={() => hostKickPlayer(p.id)}
                    className="absolute top-2.5 right-2.5 p-1 text-[#475569] hover:text-[#EF4444] rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-all cursor-pointer"
                    title={`Kick ${p.username}`}
                  >
                    <UserX size={13} />
                  </button>
                )}
                <div className="my-3">
                  <AvatarDisplay avatarId={p.avatar} size="lg" />
                </div>
                <span className="font-semibold text-sm text-[#F8FAFC] max-w-[110px] truncate">
                  {p.username}{isMe && <span className="text-xs text-[#F5A623] font-normal ml-1">(You)</span>}
                </span>
                <span className="text-[11px] mt-1 font-mono" style={{ color: p.isConnected ? '#10B981' : '#EF4444' }}>
                  {p.isConnected ? 'Ready' : 'Reconnecting…'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="lobby-footer flex flex-col sm:flex-row items-center justify-between gap-4 p-5 glass rounded-2xl">
        <button
          onClick={() => { if (window.confirm('Leave this room?')) leaveRoom(); }}
          className="btn-ghost w-full sm:w-auto px-5 py-2.5 text-xs gap-2"
        >
          <DoorOpen size={15} /> Leave Room
        </button>

        {amIHost ? (
          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              onClick={() => { if (window.confirm('Close room for all players?')) hostCloseRoom(); }}
              className="btn-crimson px-4 py-2.5 text-xs"
            >
              Close Room
            </button>
            <button
              onClick={hostStartGame}
              disabled={!canStart}
              className="btn-gold flex-1 sm:flex-initial px-7 py-2.5 gap-2 text-sm"
            >
              <Play size={15} className="fill-[#04050A]" />
              {canStart ? 'Start Match' : 'Need 2+ Players'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-sm text-[#94A3B8]">
            <span className="pulse-dot relative w-2 h-2 rounded-full bg-[#F5A623] text-[#F5A623]" />
            <span>Waiting for host to start the match…</span>
          </div>
        )}
      </div>
    </div>
  );
};
