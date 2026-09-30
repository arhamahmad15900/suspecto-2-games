import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Users, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext.js';
import { useAuth } from '../context/AuthContext.js';
import { AvatarDisplay } from './AvatarDisplay.js';
import { sounds } from '../services/sound.js';

export const RoomChat: React.FC = () => {
  const { roomState, chatMessages, isChatOpen, toggleChat, sendChatMessage } = useGame();
  const { effectiveProfile } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isChatOpen]);

  if (!isChatOpen || !roomState) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || isSubmitting) return;

    setIsSubmitting(true);
    sendChatMessage(clean);
    setInputText('');
    sounds.playClick();

    setTimeout(() => {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#181C24] border-l border-[#28303F] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Chat Header */}
      <div className="p-4 bg-[#0F1217] border-b border-[#28303F] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/25 text-[#FFB800] flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-sm text-[#E6E8EC]">Room Chat</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#181C24] text-[#FFB800] border border-[#28303F]">
                {roomState.roomCode}
              </span>
            </div>
            <span className="text-[11px] text-[#9AA0AD]">
              {roomState.players.length} {roomState.players.length === 1 ? 'player' : 'players'} connected
            </span>
          </div>
        </div>

        <button
          onClick={() => toggleChat(false)}
          aria-label="Close chat drawer"
          className="p-1.5 rounded-lg text-[#9AA0AD] hover:text-[#E6E8EC] hover:bg-[#202632] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#181C24]">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9AA0AD]">
            <div className="w-12 h-12 rounded-2xl bg-[#0F1217] border border-[#28303F] flex items-center justify-center mb-3 text-[#FFB800]">
              <MessageSquare size={22} />
            </div>
            <h4 className="font-semibold text-sm text-[#E6E8EC] mb-1">No messages yet</h4>
            <p className="text-xs leading-relaxed max-w-[220px]">
              Chat with other players in this room to strategize or deliberate who the Imposter might be!
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isSelf = msg.senderId === effectiveProfile.id;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isSelf ? 'flex-row-reverse' : ''}`}
              >
                <div className="shrink-0 mt-0.5">
                  <AvatarDisplay avatarId={msg.senderAvatar} size="sm" showBorder={false} />
                </div>

                <div
                  className={`flex flex-col max-w-[78%] ${
                    isSelf ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-[#E6E8EC]">
                      {isSelf ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-[#737B8C] font-mono">{timeStr}</span>
                  </div>

                  <div
                    className={`px-3.5 py-2 rounded-xl text-xs leading-relaxed break-words max-w-full ${
                      isSelf
                        ? 'bg-[#FFB800] text-[#0F1217] font-semibold rounded-tr-xs shadow-sm'
                        : 'bg-[#0F1217] text-[#E6E8EC] border border-[#28303F] rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[#0F1217] border-t border-[#28303F]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={300}
            placeholder="Type a message to the room..."
            aria-label="Room chat message"
            className="flex-1 bg-[#181C24] border border-[#28303F] rounded-lg px-3.5 py-2.5 text-xs text-[#E6E8EC] placeholder:text-[#737B8C] focus:outline-none focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSubmitting}
            aria-label="Send message"
            className="p-2.5 bg-[#FFB800] hover:bg-[#FFC425] active:bg-[#E5A600] disabled:opacity-40 disabled:cursor-not-allowed text-[#0F1217] font-bold rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <Send size={15} />
          </button>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-[#737B8C]">
          <span>Press Enter to send</span>
          <span>{inputText.length}/300</span>
        </div>
      </div>
    </div>
  );
};
