import React, { useState } from 'react';
import { IStudyRoom, IRoomResource } from '../../types/studyRoom';
import {
  Bot,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Send,
  X,
  Share2,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';
import { MarkdownRenderer } from '../ai/MarkdownRenderer';

interface RoomAskAIDrawerProps {
  room: IStudyRoom;
  resources: IRoomResource[];
  isOpen: boolean;
  onClose: () => void;
  onShareToChat?: (content: string) => void;
}

export const RoomAskAIDrawer: React.FC<RoomAskAIDrawerProps> = ({
  room,
  resources,
  isOpen,
  onClose,
  onShareToChat,
}) => {
  const [action, setAction] = useState<'EXPLAIN' | 'PRACTICE' | 'SUMMARIZE' | 'HINT' | 'REVISION'>('EXPLAIN');
  const [topic, setTopic] = useState(room.goal || '');
  const [prompt, setPrompt] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharedNotice, setSharedNotice] = useState(false);

  if (!isOpen) return null;

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAiResponse(null);
    try {
      const result = await studyRoomService.askAI(room._id, {
        action,
        prompt: prompt.trim() || undefined,
        topic: topic.trim() || undefined,
        resourceId: action === 'SUMMARIZE' ? selectedResourceId || undefined : undefined,
      });
      setAiResponse(result.response);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to get AI assistance.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareToRoomChat = async () => {
    if (!aiResponse) return;
    try {
      await studyRoomService.sendMessage(
        room._id,
        `🤖 **Study Room AI Assistant (${action})**:\n\n${aiResponse}`
      );
      setSharedNotice(true);
      setTimeout(() => setSharedNotice(false), 2500);
      if (onShareToChat) onShareToChat(aiResponse);
    } catch (err: any) {
      console.error('Failed to share AI response to chat:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Room AI Study Assistant</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  Orchestrated
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contextual study help scoped to this room's goal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'EXPLAIN', label: 'Explain Topic', icon: BookOpen },
              { id: 'PRACTICE', label: 'Practice Questions', icon: HelpCircle },
              { id: 'SUMMARIZE', label: 'Summarize Doc', icon: FileText },
              { id: 'HINT', label: 'Give Hint', icon: Sparkles },
              { id: 'REVISION', label: 'Quick Revision', icon: Bot },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = action === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAction(item.id as any)}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleAskAI} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {action === 'SUMMARIZE' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Choose Shared Resource
                </label>
                {resources.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No resources uploaded yet. Share a document in the Resources tab first.
                  </p>
                ) : (
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">Select a shared document...</option>
                    {resources.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title || (r.resourceId as any)?.fileName || 'Document'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Concept / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Binary Search Trees or Dynamic Programming"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Specific Question / Instruction (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Ask anything specific or leave blank for a standard breakdown..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Orchestrating AI Response...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Insights</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Response Display */}
          {aiResponse && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" /> AI Study Assistant Answer
                </span>

                <button
                  onClick={handleShareToRoomChat}
                  disabled={sharedNotice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-all"
                >
                  {sharedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Shared to Chat!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share to Room Chat</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-h-80 overflow-y-auto">
                <MarkdownRenderer content={aiResponse} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
