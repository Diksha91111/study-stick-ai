import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Wrench,
  Bug,
  RefreshCw,
  Zap,
  CheckSquare,
  Languages,
  MessageSquareCode,
  ShieldCheck,
  Send,
  XCircle,
  X,
  Code2,
  FileText,
  AlertCircle,
  ChevronRight,
  Bot,
  User,
} from 'lucide-react';
import {
  codeAssistantService,
  AICodeAction,
  AICodeAssistantResponseData,
} from '../../services/codeAssistantService';

interface CodeAssistantPanelProps {
  currentLanguage: string;
  currentCode: string;
  selectedCode?: string;
  stderr?: string;
  stdout?: string;
  onOpenProposalDiff: (
    explanation: string,
    proposedCode: string,
    originalSnapshot: string,
    language: string
  ) => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  action?: AICodeAction;
  text: string;
  proposedCode?: string;
  originalSnapshot?: string;
  language?: string;
  timestamp: string;
}

const ACTIONS_CONFIG: Array<{
  id: AICodeAction;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}> = [
  {
    id: 'explain',
    label: 'Explain',
    description: 'Understand code flow, variables, and Big-O',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'teach',
    label: 'Teach',
    description: 'Step-by-step guided learning',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'hint',
    label: 'Hint',
    description: 'Progressive conceptual hints',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'debug',
    label: 'Debug',
    description: 'Analyze stderr/stdout and trace bugs',
    icon: Bug,
    color: 'from-rose-500 to-pink-600',
    badge: 'Propose Diff',
  },
  {
    id: 'interview',
    label: 'Interview',
    description: 'Mock technical interview and feedback',
    icon: MessageSquareCode,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'exam',
    label: 'Exam',
    description: 'Generate questions and evaluate submissions',
    icon: ShieldCheck,
    color: 'from-fuchsia-500 to-pink-600',
    badge: 'Evaluate',
  },
];

const TARGET_LANGUAGES = ['python', 'javascript', 'c', 'cpp', 'java'];

export const CodeAssistantPanel: React.FC<CodeAssistantPanelProps> = ({
  currentLanguage,
  currentCode,
  selectedCode,
  stderr,
  stdout,
  onOpenProposalDiff,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your **AI Copilot**. Select any mode below or ask about your code.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [explainLevel, setExplainLevel] = useState<string>('Beginner');
  const [targetLang, setTargetLang] = useState<string>('python');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<AICodeAction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [conversationIds, setConversationIds] = useState<Partial<Record<AICodeAction, string>>>({});
  const [lastRequest, setLastRequest] = useState<{ action: AICodeAction, promptText?: string } | null>(null);

  const handleCancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setIsLoading(false);
      setActiveAction(null);
      setErrorMsg('Request cancelled by user.');
    }
  };

  const triggerAction = async (action: AICodeAction, promptText?: string) => {
    if (isLoading) return;

    setErrorMsg(null);
    setIsLoading(true);
    setActiveAction(action);
    setLastRequest({ action, promptText });

    const controller = new AbortController();
    setAbortController(controller);

    const actionLabel = ACTIONS_CONFIG.find((a) => a.id === action)?.label || action;
    const userMsgId = `user_${Date.now()}`;
    let basePrompt = promptText ? `[${actionLabel}] ${promptText}` : `[${actionLabel}] Process current code context`;
    
    if (action === 'explain') {
        basePrompt += ` (Explain at ${explainLevel} Level)`;
    }
    
    const userMsgText = basePrompt;

    const snapshotAtRequestTime = currentCode;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        action,
        text: userMsgText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const response: AICodeAssistantResponseData = await codeAssistantService.requestAssistantAction(
        {
          action,
          language: currentLanguage,
          code: currentCode,
          selectedCode: selectedCode || undefined,
          userPrompt: promptText || undefined,
          targetLanguage: action === 'convertLanguage' ? targetLang : undefined,
          errorContext: stderr || stdout ? { stderr, stdout } : undefined,
          conversationId: conversationIds[action],
        },
        controller.signal
      );

      setConversationIds((prev) => ({ ...prev, [action]: response.conversationId }));

      const assistantMsgId = `assistant_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          action: response.action,
          text: response.explanation,
          proposedCode: response.proposedCode,
          originalSnapshot: snapshotAtRequestTime,
          language: response.language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // If action returned code modification proposal, open Diff viewer
      if (response.hasCodeChanges && response.proposedCode) {
        onOpenProposalDiff(
          response.explanation,
          response.proposedCode,
          snapshotAtRequestTime,
          response.language
        );
      }
    } catch (err: any) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        const errorString =
          err?.response?.data?.message || err?.message || 'Failed to complete AI request.';
        setErrorMsg(errorString);
      }
    } finally {
      setIsLoading(false);
      setActiveAction(null);
      setAbortController(null);
      setUserPrompt('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 font-sans select-none text-slate-100 min-h-0 overflow-hidden">
      {/* Panel Top Header */}
      <div className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">AI Copilot</h2>
            <p className="text-[10px] text-slate-400">Context-aware coding assistant</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close AI Copilot"
            aria-label="Close AI Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Context Pills Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[10px] font-mono shrink-0">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          <Code2 className="w-3 h-3 text-indigo-400" />
          {currentLanguage.toUpperCase()}
        </span>

        {selectedCode && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
            <FileText className="w-3 h-3 text-indigo-400" />
            Selection Active ({selectedCode.split('\n').length} lines)
          </span>
        )}

        {stderr && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/50 animate-pulse">
            <Bug className="w-3 h-3 text-rose-400" />
            Stderr Attached
          </span>
        )}
      </div>

      {/* Main Content Area: Actions Grid + Chat Scroll */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 min-h-0">
        {/* 6 Copilot Modes Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Copilot Modes
            </span>
            <span className="text-[10px] text-slate-500">Click mode to start</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ACTIONS_CONFIG.map((action) => {
              const IconComp = action.icon;
              const isCurrentActive = activeAction === action.id;

              return (
                <button
                  key={action.id}
                  onClick={() => triggerAction(action.id, userPrompt || undefined)}
                  disabled={isLoading}
                  className={`group relative flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrentActive
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div
                      className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    {action.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs text-slate-200 group-hover:text-white">
                    {action.label}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {action.description}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        <hr className="border-slate-800" />

        {/* Conversation Stream */}
        <div className="space-y-3 font-sans">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Copilot Conversation
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs space-y-1">
              <div className="font-bold flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  Assistant Error
                </div>
                {lastRequest && (
                  <button
                    onClick={() => triggerAction(lastRequest.action, lastRequest.promptText)}
                    className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/50 transition-colors"
                  >
                    Retry Request
                  </button>
                )}
              </div>
              <p>{errorMsg}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-xl text-xs space-y-2 transition-all ${
                msg.role === 'user'
                  ? 'bg-slate-800/80 border border-slate-700/60 ml-4 text-slate-200'
                  : 'bg-slate-950 border border-slate-800/90 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{msg.role === 'user' ? 'You' : 'AI Copilot'}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">{msg.timestamp}</span>
              </div>

              <div className="leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                {msg.text}
              </div>

              {msg.proposedCode && msg.originalSnapshot && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Code modification proposed
                  </span>
                  <button
                    onClick={() =>
                      onOpenProposalDiff(
                        msg.text,
                        msg.proposedCode!,
                        msg.originalSnapshot!,
                        msg.language || currentLanguage
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold cursor-pointer transition-all"
                  >
                    <span>View Proposal Diff</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Processing AI Action ({activeAction})...</span>
              </div>
              <button
                onClick={handleCancelRequest}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Chat Prompt Input Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Explain Level:</span>
            <select
                value={explainLevel}
                onChange={(e) => setExplainLevel(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
            </select>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userPrompt.trim()) {
              triggerAction('explain', userPrompt.trim());
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Ask about your code..."
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !userPrompt.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
