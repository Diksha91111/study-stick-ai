import React, { useState, useRef, useEffect } from 'react';
import { IRoomMessage, RoomRole } from '../../types/studyRoom';
import { Send, Trash2, Bot, Info, Clock, AlertCircle } from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';

interface RoomChatTabProps {
  roomId: string;
  messages: IRoomMessage[];
  currentUserId: string;
  userRole: RoomRole;
  onRefreshMessages: () => void;
}

export const RoomChatTab: React.FC<RoomChatTabProps> = ({
  roomId,
  messages,
  currentUserId,
  userRole,
  onRefreshMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content) return;

    if (content.length > 500) {
      setSendError('Message exceeds maximum limit of 500 characters.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    try {
      await studyRoomService.sendMessage(roomId, content);
      setInputText('');
      onRefreshMessages();
    } catch (err: any) {
      setSendError(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await studyRoomService.deleteMessage(roomId, messageId);
      onRefreshMessages();
    } catch (err: any) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[580px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Welcome to Room Chat</p>
            <p className="text-xs mt-1 max-w-sm">
              Ask doubts, share notes, and coordinate your study goals with room peers.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.type === 'SYSTEM';
            const isAI = msg.type === 'AI_SUMMARY';
            const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id;
            const isMe = senderId === currentUserId;
            const senderName = typeof msg.senderId === 'string' ? 'User' : msg.senderId?.name || 'Peer';

            if (isSystem) {
              return (
                <div key={msg._id} className="flex items-center justify-center my-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Info className="w-3 h-3 text-indigo-500" />
                    <span>{msg.content}</span>
                    <span className="opacity-60 text-[10px]">({formatTime(msg.createdAt)})</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                className={`group flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                    isMe
                      ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {senderName.charAt(0)}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] sm:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isMe ? 'You' : senderName}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-2xs ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : isAI
                        ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-950 dark:text-violet-100 border border-violet-200 dark:border-violet-800/60 rounded-tl-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {/* Safe text rendering */}
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Delete button (for own messages or owner/admin) */}
                    {(isMe || userRole === 'OWNER' || userRole === 'ADMIN') && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete message"
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1 rounded-full bg-slate-900/80 text-slate-200 hover:text-rose-400 text-xs shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-200/80 dark:border-slate-800">
        {sendError && (
          <div className="mb-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{sendError}</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Send a study message or question... (Enter to send)"
            value={inputText}
            maxLength={500}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <div className="mt-1.5 flex justify-end px-1">
          <span className="text-[10px] text-slate-400">
            {inputText.length} / 500 characters
          </span>
        </div>
      </div>
    </div>
  );
};
