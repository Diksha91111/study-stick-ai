import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  aiService,
  AIConversationItem,
  AIMessageItem,
  TutorMode,
  AIProviderStatus,
} from '../services/aiService';
import { MarkdownRenderer } from '../components/ai/MarkdownRenderer';
import {
  AttachmentPreviewChips,
  AttachmentMenuButton,
  PendingAttachment,
} from '../components/ai/ResourceAttachmentBar';
import { SourceCitations } from '../components/ai/SourceCitations';
import { VideoLinkModal } from '../components/ai/VideoLinkModal';
import { ResourceLibraryModal } from '../components/ai/ResourceLibraryModal';
import {
  resourceService,
  ResourceType,
  StudyResourceItem,
} from '../services/resourceService';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Square,
  Copy,
  RefreshCw,
  Search,
  BookOpen,
  Lightbulb,
  Puzzle,
  Zap,
  Target,
  Compass,
  AlertTriangle,
  UploadCloud,
  FolderOpen,
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeMode, setActiveMode] = useState<TutorMode>('learn');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);
  const [providerStatus, setProviderStatus] = useState<AIProviderStatus | null>(null);

  // Multimodal file upload & resource states
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isVideoLinkModalOpen, setIsVideoLinkModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const location = useLocation();
  const contextAppliedRef = useRef(false);

  // Check incoming concept context from Knowledge Graph
  useEffect(() => {
    if (contextAppliedRef.current) return;
    const state = location.state as {
      conceptTitle?: string;
      initialPrompt?: string;
      topic?: string;
    } | null;

    if (state?.initialPrompt) {
      setInputMessage(state.initialPrompt);
      contextAppliedRef.current = true;
    }
  }, [location.state]);

  // Fetch initial conversations list & provider status
  useEffect(() => {
    loadConversations();
    checkProviders();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  // Auto-scroll to bottom on message updates or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, isStreaming]);

  const checkProviders = async () => {
    try {
      const status = await aiService.getProviderStatus();
      setProviderStatus(status);
    } catch {
      // Ignore
    }
  };

  const loadConversations = async () => {
    try {
      setErrorMsg(null);
      const data = await aiService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0]._id);
        setActiveMode(data[0].tutorMode || 'learn');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load conversations.');
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      setErrorMsg(null);
      const conv = await aiService.getConversationById(convId);
      setMessages(conv.messages || []);
      setActiveMode(conv.tutorMode || 'learn');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load message history.');
    }
  };

  const handleCreateNewSession = async (mode: TutorMode = activeMode) => {
    try {
      setErrorMsg(null);
      const newConv = await aiService.createConversation('New Study Session', mode);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv._id);
      setActiveMode(mode);
      setMessages([]);
      setPendingAttachments([]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create new session.');
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this study session?')) return;
    try {
      await aiService.deleteConversation(id);
      const updated = conversations.filter((c) => c._id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        if (updated.length > 0) {
          setActiveConvId(updated[0]._id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete session.');
    }
  };

  const handleStartRename = (conv: AIConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv._id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editingTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      const updated = await aiService.updateConversation(id, { title: editingTitle.trim() });
      setConversations((prev) => prev.map((c) => (c._id === id ? updated : c)));
      setEditingConvId(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to rename conversation.');
    }
  };

  const handleModeChange = async (mode: TutorMode) => {
    setActiveMode(mode);
    if (activeConvId) {
      try {
        const updated = await aiService.updateConversation(activeConvId, { tutorMode: mode });
        setConversations((prev) => prev.map((c) => (c._id === activeConvId ? updated : c)));
      } catch {
        // Ignore background error
      }
    }
  };

  // --- File validation & upload pipeline ---
  const validateAndUploadFile = (file: File, explicitType?: ResourceType) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    let resolvedType: ResourceType = explicitType || 'docx';
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      resolvedType = 'image';
    } else if (ext === 'pdf') {
      resolvedType = 'pdf';
    } else if (['ppt', 'pptx'].includes(ext)) {
      resolvedType = 'pptx';
    } else if (['docx', 'doc', 'txt'].includes(ext)) {
      resolvedType = 'docx';
    } else if (['mp4', 'webm', 'mov', 'mkv'].includes(ext)) {
      resolvedType = 'video';
    } else {
      setErrorMsg(
        `Unsupported file type ".${ext}". Supported types: PDF, PPT/PPTX, Word (DOCX/DOC), TXT, Images (PNG, JPG, WEBP), and Videos.`
      );
      return;
    }

    let maxSize = 50 * 1024 * 1024; // 50MB default
    if (resolvedType === 'image') maxSize = 20 * 1024 * 1024;
    if (resolvedType === 'video') maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMsg(`File "${file.name}" exceeds the allowed limit of ${maxSize / (1024 * 1024)}MB.`);
      return;
    }

    handleFileUpload(file, resolvedType);
  };

  const handleFileUpload = async (file: File, type: ResourceType) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pending: PendingAttachment = {
      tempId,
      filename: file.name,
      resourceType: type,
      fileSize: file.size,
      status: 'UPLOADING',
      progress: 0,
    };

    setPendingAttachments((prev) => [...prev, pending]);

    try {
      const res: StudyResourceItem = await resourceService.uploadFile(
        file,
        activeConvId || undefined,
        (progressPercent) => {
          setPendingAttachments((prev) =>
            prev.map((a) =>
              a.tempId === tempId
                ? {
                    ...a,
                    progress: progressPercent,
                    status: progressPercent >= 100 ? 'PROCESSING' : 'UPLOADING',
                  }
                : a
            )
          );
        }
      );

      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.tempId === tempId
            ? {
                ...a,
                resourceId: res._id,
                status: res.processingStatus,
                errorMessage: res.errorMessage,
                pageCount: res.metadata?.pageCount,
                slideCount: res.metadata?.slideCount,
              }
            : a
        )
      );
    } catch (err: any) {
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.tempId === tempId
            ? {
                ...a,
                status: 'FAILED',
                errorMessage: err.response?.data?.message || err.message || 'Upload failed.',
              }
            : a
        )
      );
    }
  };

  const handleRetryAttachment = async (attachment: PendingAttachment) => {
    if (!attachment.resourceId) return;
    setPendingAttachments((prev) =>
      prev.map((a) =>
        a.tempId === attachment.tempId
          ? { ...a, status: 'PROCESSING', errorMessage: undefined }
          : a
      )
    );

    try {
      const updated = await resourceService.retryResource(attachment.resourceId);
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.tempId === attachment.tempId
            ? {
                ...a,
                status: updated.processingStatus,
                errorMessage: updated.errorMessage,
                pageCount: updated.metadata?.pageCount,
                slideCount: updated.metadata?.slideCount,
              }
            : a
        )
      );
    } catch (err: any) {
      setPendingAttachments((prev) =>
        prev.map((a) =>
          a.tempId === attachment.tempId
            ? {
                ...a,
                status: 'FAILED',
                errorMessage: err.response?.data?.message || err.message || 'Retry failed.',
              }
            : a
        )
      );
    }
  };

  const handleRemoveAttachment = (tempId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  const handleAttachFromLibrary = (resource: StudyResourceItem) => {
    if (pendingAttachments.some((a) => a.resourceId === resource._id)) return;
    const pending: PendingAttachment = {
      tempId: `lib_${resource._id}`,
      resourceId: resource._id,
      filename: resource.originalFilename,
      resourceType: resource.resourceType,
      fileSize: resource.fileSize,
      status: resource.processingStatus,
      errorMessage: resource.errorMessage,
      pageCount: resource.metadata?.pageCount,
      slideCount: resource.metadata?.slideCount,
    };
    setPendingAttachments((prev) => [...prev, pending]);
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        validateAndUploadFile(file);
      }
    }
  };

  // Chat message sending
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isStreaming || isLoading) return;

    // Check if attachments are actively uploading or processing
    const hasPendingUploads = pendingAttachments.some(
      (a) => a.status === 'UPLOADING' || a.status === 'PROCESSING'
    );
    if (hasPendingUploads) {
      setErrorMsg('Please wait for attachments to finish processing before sending.');
      return;
    }

    setErrorMsg(null);
    setInputMessage('');
    setIsLoading(true);

    const readyResourceIds = pendingAttachments
      .filter((a) => a.status === 'READY' && a.resourceId)
      .map((a) => a.resourceId as string);

    const tempUserMsg: AIMessageItem = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let targetConvId = activeConvId;

    try {
      setIsStreaming(true);
      setStreamingContent('');

      let accumContent = '';
      let capturedSources: any[] | undefined = undefined;

      await aiService.streamChatMessage(
        {
          message: textToSend,
          conversationId: targetConvId || undefined,
          tutorMode: activeMode,
          resourceIds: readyResourceIds.length > 0 ? readyResourceIds : undefined,
        },
        (chunk) => {
          if (chunk.conversationId && !targetConvId) {
            targetConvId = chunk.conversationId;
            setActiveConvId(chunk.conversationId);
          }
          if (chunk.sources) {
            capturedSources = chunk.sources;
          }
          if (chunk.textChunk) {
            accumContent += chunk.textChunk;
            setStreamingContent(accumContent);
          }
        },
        () => {
          // Stream completed
          setIsStreaming(false);
          setIsLoading(false);
          const assistantMsg: AIMessageItem = {
            role: 'assistant',
            content: accumContent,
            sources: capturedSources,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');
          loadConversations();
        },
        (err) => {
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingContent('');
          setErrorMsg(err.message || 'Error receiving AI response.');
        },
        abortController.signal
      );
    } catch (err: any) {
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingContent('');
      setErrorMsg(err.message || 'Connection error.');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsLoading(false);
      if (streamingContent) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${streamingContent} *(stopped)*`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setStreamingContent('');
      }
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIndex(index);
    setTimeout(() => setCopiedMsgIndex(null), 2000);
  };

  const handleRegenerateLast = () => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tutorModeConfig: Array<{ mode: TutorMode; label: string; icon: any }> = [
    { mode: 'learn', label: 'Learn', icon: BookOpen },
    { mode: 'explain', label: 'Explain', icon: Lightbulb },
    { mode: 'practice', label: 'Practice', icon: Puzzle },
    { mode: 'quiz', label: 'Quiz Me', icon: Zap },
    { mode: 'exam', label: 'Exam Mode', icon: Target },
    { mode: 'coach', label: 'Study Coach', icon: Compass },
  ];

  const suggestedPromptsByMode: Record<TutorMode, string[]> = {
    learn: [
      'Teach me the fundamentals of Operating Systems process scheduling',
      'Start a systematic tutorial on Dynamic Programming from scratch',
      'Explain how TCP 3-way handshaking works with a step-by-step walkthrough',
    ],
    explain: [
      'Explain the difference between Paging and Segmentation simply with real-world analogies',
      'Why does quicksort have worst case O(n^2) and how do we avoid it?',
      'Break down Bayes theorem with an intuitive example',
    ],
    practice: [
      'Give me 3 practice problems on Binary Search Trees with hints',
      'Give me a tricky SQL join exercise based on university schema',
      'Create a practice question on Amdahl’s Law and review my steps',
    ],
    quiz: [
      'Quiz me on Database Normalization with 5 multiple choice questions',
      'Create a rapid-fire viva quiz on Computer Networks OSI layers',
      'Test my understanding of Graph Traversals with immediate explanations',
    ],
    exam: [
      'Generate a 10-mark university exam question on Memory Management algorithms',
      'Give me a GATE-style question on Discrete Mathematics Relations',
      'Create a mock midterm exam covering CPU scheduling and deadlocks',
    ],
    coach: [
      'Help me plan my study schedule for my upcoming examinations',
      'How should I approach revising high-yield topics effectively?',
      'I am falling behind on Computer Networks. What should I prioritize this week?',
    ],
  };

  const hasPendingUploads = pendingAttachments.some(
    (a) => a.status === 'UPLOADING' || a.status === 'PROCESSING'
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-hidden select-none">
      {/* SIDEBAR: Conversation History */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        {/* Sidebar Header: New Chat Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <button
            onClick={() => handleCreateNewSession()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-indigo-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Session</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConvId === conv._id;

              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConvId(conv._id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Bot className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />

                    {editingConvId === conv._id ? (
                      <div className="flex items-center gap-1 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(conv._id);
                            if (e.key === 'Escape') setEditingConvId(null);
                          }}
                          className="w-full px-2 py-0.5 text-xs bg-white dark:bg-slate-800 border border-indigo-400 rounded focus:outline-none text-slate-900 dark:text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(conv._id)}
                          className="p-1 hover:text-emerald-500"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingConvId(null)}
                          className="p-1 hover:text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="truncate">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isActive
                              ? 'text-indigo-950 dark:text-indigo-200'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {conv.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {conv.tutorMode || 'learn'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {editingConvId !== conv._id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={(e) => handleStartRename(conv, e)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div
        className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* DRAG AND DROP OVERLAY */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-indigo-600/10 dark:bg-indigo-950/50 backdrop-blur-xs border-2 border-dashed border-indigo-500 dark:border-indigo-400 rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-3 animate-bounce">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drop study materials here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
              Upload PDF, PPT, Word, TXT, Images, or Videos to ground your study session
            </p>
          </div>
        )}

        {/* TOP HEADER: Mode Tabs & Provider / Resources Info */}
        <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {/* Modes selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {tutorModeConfig.map((item) => {
              const Icon = item.icon;
              const isSelected = activeMode === item.mode;

              return (
                <button
                  key={item.mode}
                  onClick={() => handleModeChange(item.mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* My Study Resources Button */}
            <button
              onClick={() => setIsLibraryModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Open My Study Resources Library"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">My Resources</span>
            </button>

            {/* Active Model Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>
                {providerStatus?.hasActiveProvider
                  ? providerStatus.configuredProviders.map((p) => p.name).join(' / ')
                  : 'AI Orchestrator'}
              </span>
            </div>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-amber-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MESSAGES CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && !isStreaming ? (
            /* EMPTY STATE WITH SUGGESTED PROMPTS */
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Study Stick AI Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Upload study materials (PDF, PPT, Word, Images, Videos) or ask questions across all modes!
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="space-y-2 text-left pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">
                  Suggested {activeMode.toUpperCase()} Prompts
                </p>
                <div className="grid gap-2">
                  {suggestedPromptsByMode[activeMode].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 flex items-center justify-between group"
                    >
                      <span>&quot;{prompt}&quot;</span>
                      <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MESSAGE LIST */
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-4 max-w-4xl mx-auto ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md ${
                      isUser
                        ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/20'
                        : 'bg-slate-800 dark:bg-slate-800 border border-slate-700 shadow-slate-900/50'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`group relative max-w-[85%] rounded-2xl p-4 shadow-xs transition-all ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.content} />
                        {msg.sources && msg.sources.length > 0 && (
                          <SourceCitations sources={msg.sources} />
                        )}
                      </>
                    )}

                    {/* Action Bar for AI messages */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-slate-400 text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                          title="Copy Markdown"
                        >
                          {copiedMsgIndex === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {idx === messages.length - 1 && (
                          <button
                            onClick={handleRegenerateLast}
                            className="flex items-center gap-1 hover:text-indigo-500 transition-colors ml-2"
                            title="Regenerate response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* STREAMING RESPONSE IN PROGRESS */}
          {isStreaming && (
            <div className="flex gap-4 max-w-4xl mx-auto flex-row">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-800 text-white font-bold text-xs shadow-md border border-slate-700">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="max-w-[85%] rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-xs">
                {streamingContent ? (
                  <MarkdownRenderer content={streamingContent} />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono py-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    <span>Analyzing context & materials...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT CONTAINER */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-4xl mx-auto">
            {/* ATTACHMENT PREVIEW CHIPS */}
            <AttachmentPreviewChips
              attachments={pendingAttachments}
              onRemoveAttachment={handleRemoveAttachment}
              onRetryAttachment={handleRetryAttachment}
            />

            {/* INPUT ROW: [ + / Paperclip ] [ Textarea ] [ Send / Stop ] */}
            <div className="relative flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
              {/* Attachment menu trigger */}
              <AttachmentMenuButton
                onFileUpload={(file, type) => validateAndUploadFile(file, type)}
                onOpenVideoLinkModal={() => setIsVideoLinkModalOpen(true)}
                onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
                disabled={isStreaming || isLoading}
              />

              <textarea
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask Study Stick AI (${activeMode.toUpperCase()} mode)... (Shift+Enter for newline)`}
                className="flex-1 bg-transparent border-0 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 resize-none py-1.5 px-2"
              />

              <div className="flex items-center gap-2 shrink-0">
                {isStreaming ? (
                  <button
                    onClick={handleStopGeneration}
                    className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-sm"
                    title="Stop generating"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={
                      (!inputMessage.trim() && pendingAttachments.length === 0) ||
                      isLoading ||
                      hasPendingUploads
                    }
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md shadow-indigo-500/20"
                    title={
                      hasPendingUploads
                        ? 'Wait for attachments to finish processing'
                        : 'Send Message'
                    }
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Link Modal */}
      <VideoLinkModal
        isOpen={isVideoLinkModalOpen}
        onClose={() => setIsVideoLinkModalOpen(false)}
        conversationId={activeConvId || undefined}
        onSuccess={(resource) => {
          handleAttachFromLibrary(resource);
        }}
      />

      {/* Resource Library Modal */}
      <ResourceLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onAttachResource={(resource) => {
          handleAttachFromLibrary(resource);
          setIsLibraryModalOpen(false);
        }}
        attachedResourceIds={pendingAttachments
          .map((a) => a.resourceId)
          .filter(Boolean) as string[]}
      />
    </div>
  );
};
