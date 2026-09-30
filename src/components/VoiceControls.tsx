import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { sounds } from '../services/sound.js';

export const VoiceControls: React.FC = () => {
  const {
    roomState,
    voiceJoined,
    voiceMuted,
    voiceSpeaking,
    voicePermission,
    voiceError,
    voiceParticipants,
    joinVoiceChat,
    leaveVoiceChat,
    toggleVoiceMute,
  } = useGame();
  const { effectiveProfile } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  if (!roomState) return null;

  const handleToggleVoice = async () => {
    sounds.playClick();
    if (voiceJoined) {
      leaveVoiceChat();
    } else {
      setIsConnecting(true);
      await joinVoiceChat();
      setIsConnecting(false);
    }
  };

  const handleMuteClick = () => {
    sounds.playClick();
    toggleVoiceMute();
  };

  // Count active voice users (including self if joined)
  const connectedVoiceUsers = Object.keys(voiceParticipants);
  const voiceUserCount = connectedVoiceUsers.length + (voiceJoined && !voiceParticipants[effectiveProfile.id] ? 1 : 0);

  return (
    <div className="relative inline-flex items-center gap-2 select-none">
      {/* Voice Toggle Button */}
      {!voiceJoined ? (
        <button
          onClick={handleToggleVoice}
          disabled={isConnecting || voicePermission === 'unsupported'}
          aria-label="Join room voice chat"
          title="Join voice communication"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181C24] hover:bg-[#202632] border border-[#28303F] hover:border-[#3A455A] text-xs font-semibold text-[#9AA0AD] hover:text-[#E6E8EC] transition-all cursor-pointer disabled:opacity-50"
        >
          {isConnecting ? (
            <Loader2 size={14} className="animate-spin text-[#FFB800]" />
          ) : (
            <Mic size={14} className="text-[#9AA0AD]" />
          )}
          <span className="hidden sm:inline">{isConnecting ? 'Connecting...' : 'Join Voice'}</span>
          {voiceUserCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-[#FFB800]/20 text-[#FFB800] text-[10px] font-mono font-bold">
              {voiceUserCount}
            </span>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#181C24] border border-[#28303F] shadow-md">
          {/* Mute/Unmute Toggle */}
          <button
            onClick={handleMuteClick}
            aria-label={voiceMuted ? 'Unmute microphone' : 'Mute microphone'}
            title={voiceMuted ? 'Microphone is muted (Click to unmute)' : 'Microphone is live (Click to mute)'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              voiceMuted
                ? 'bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] hover:bg-[#FFB800]/25'
                : voiceSpeaking
                ? 'bg-[#FFB800]/25 border border-[#FFB800] text-[#FFB800] ring-2 ring-[#FFB800]/40 animate-pulse'
                : 'bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] hover:bg-[#FFB800]/25'
            }`}
          >
            {voiceMuted ? (
              <MicOff size={13} className="text-[#FFB800]" />
            ) : (
              <Mic size={13} className="text-[#FFB800]" />
            )}
            <span className="hidden sm:inline">{voiceMuted ? 'Muted' : voiceSpeaking ? 'Speaking...' : 'Unmuted'}</span>
          </button>

          {/* Connected Participants Count Pill */}
          <button
            onClick={() => setShowRoster(!showRoster)}
            aria-label="Toggle voice participants list"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] transition-colors cursor-pointer"
          >
            <Users size={13} />
            <span className="font-mono text-[11px] font-bold text-[#FFB800]">{voiceUserCount}</span>
          </button>

          {/* Leave Voice */}
          <button
            onClick={handleToggleVoice}
            aria-label="Disconnect from voice chat"
            title="Leave voice chat"
            className="px-2 py-1 rounded-md text-xs text-[#E63946] hover:bg-[#E63946]/10 hover:text-[#FF6B7A] transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      )}

      {/* Permission / Error Notice */}
      {voiceError && (
        <div className="absolute top-full left-0 mt-2 z-50 p-2.5 bg-[#181C24] border border-[#E63946]/40 rounded-xl text-xs text-[#FF9AA2] shadow-xl max-w-xs flex items-start gap-2">
          <AlertCircle size={14} className="text-[#E63946] shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span>{voiceError}</span>
          </div>
        </div>
      )}

      {/* Voice Participants Roster Dropdown */}
      {showRoster && voiceJoined && (
        <div className="absolute top-full right-0 mt-2 z-50 w-56 bg-[#181C24] border border-[#28303F] rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#28303F] mb-2 text-xs font-bold text-[#E6E8EC]">
            <span>Voice Members</span>
            <span className="text-[10px] text-[#FFB800] font-mono">{voiceUserCount} Connected</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* Self */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#0F1217] border border-[#28303F]">
              <div className="flex items-center gap-2">
                <div className={`relative ${voiceSpeaking ? 'ring-2 ring-[#FFB800] rounded-lg' : ''}`}>
                  <AvatarDisplay avatarId={effectiveProfile.avatar} size="sm" showBorder={false} />
                </div>
                <span className="text-xs font-semibold text-[#E6E8EC] truncate max-w-[85px]">
                  {effectiveProfile.username} (You)
                </span>
              </div>
              {voiceMuted ? (
                <MicOff size={12} className="text-[#FFB800]" />
              ) : (
                <Mic size={12} className={voiceSpeaking ? 'text-[#FFB800]' : 'text-[#737B8C]'} />
              )}
            </div>

            {/* Other room players in voice */}
            {roomState.players
              .filter((p) => p.id !== effectiveProfile.id && voiceParticipants[p.id])
              .map((p) => {
                const status = voiceParticipants[p.id];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#0F1217] border border-[#28303F]"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`relative ${status?.isSpeaking ? 'ring-2 ring-[#FFB800] rounded-lg' : ''}`}>
                        <AvatarDisplay avatarId={p.avatar} size="sm" showBorder={false} />
                      </div>
                      <span className="text-xs font-medium text-[#E6E8EC] truncate max-w-[95px]">
                        {p.username}
                      </span>
                    </div>
                    {status?.isMuted ? (
                      <MicOff size={12} className="text-[#FFB800]" />
                    ) : (
                      <Mic size={12} className={status?.isSpeaking ? 'text-[#FFB800] animate-pulse' : 'text-[#737B8C]'} />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
