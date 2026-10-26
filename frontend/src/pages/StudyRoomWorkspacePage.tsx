import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IStudyRoom,
  IRoomMember,
  IRoomMessage,
  IRoomTask,
  IRoomResource,
  IRoomQuizSession,
  RoomRole,
} from '../types/studyRoom';
import { studyRoomService } from '../services/studyRoomService';
import { FocusSessionBar } from '../components/study-rooms/FocusSessionBar';
import { RoomChatTab } from '../components/study-rooms/RoomChatTab';
import { RoomResourcesTab } from '../components/study-rooms/RoomResourcesTab';
import { RoomTasksTab } from '../components/study-rooms/RoomTasksTab';
import { RoomQuizTab } from '../components/study-rooms/RoomQuizTab';
import { RoomProgressTab } from '../components/study-rooms/RoomProgressTab';
import { RoomMembersDrawer } from '../components/study-rooms/RoomMembersDrawer';
import { RoomAskAIDrawer } from '../components/study-rooms/RoomAskAIDrawer';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  FileText,
  ListTodo,
  GraduationCap,
  TrendingUp,
  Bot,
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
  Play,
  LogOut,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';

export const StudyRoomWorkspacePage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  // Authoritative Room State
  const [room, setRoom] = useState<IStudyRoom | null>(null);
  const [members, setMembers] = useState<IRoomMember[]>([]);
  const [messages, setMessages] = useState<IRoomMessage[]>([]);
  const [tasks, setTasks] = useState<IRoomTask[]>([]);
  const [resources, setResources] = useState<IRoomResource[]>([]);
  const [quizzes, setQuizzes] = useState<IRoomQuizSession[]>([]);

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHAT' | 'RESOURCES' | 'TASKS' | 'QUIZ' | 'PROGRESS'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Modals & Drawers
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(45);
  const [sessionCustomGoal, setSessionCustomGoal] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Fetch full room data
  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      const roomData = await studyRoomService.getRoom(roomId);
      setRoom(roomData);
      setMembers(roomData.members || []);

      // Concurrently fetch tab datasets safely
      const results = await Promise.allSettled([
        studyRoomService.getMessages(roomId),
        studyRoomService.getTasks(roomId),
        studyRoomService.getResources(roomId),
        studyRoomService.getQuizzes(roomId),
      ]);
      if (results[0].status === 'fulfilled') setMessages(results[0].value || []);
      if (results[1].status === 'fulfilled') setTasks(results[1].value || []);
      if (results[2].status === 'fulfilled') setResources(results[2].value || []);
      if (results[3].status === 'fulfilled') {
        const val = results[3].value;
        setQuizzes(Array.isArray(val) ? val : (val ? [val] : []));
      }
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load study room.');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Set presence to ONLINE on mount, and OFFLINE on unmount
  useEffect(() => {
    if (!roomId) return;
    studyRoomService.updatePresence(roomId, 'ONLINE').catch(() => {});

    return () => {
      studyRoomService.updatePresence(roomId, 'OFFLINE').catch(() => {});
    };
  }, [roomId]);

  // Real-time SSE Stream Subscription
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = studyRoomService.subscribeToRoomStream(
      roomId,
      (event, payload) => {
        if (event === 'focus_session_update') {
          setRoom((prev) => (prev ? { ...prev, activeSession: payload } : null));
        } else if (event === 'chat_message') {
          setMessages((prev) => {
            if (prev.some((m) => m._id === payload._id)) return prev;
            return [...prev, payload];
          });
        } else if (event === 'task_update') {
          studyRoomService.getTasks(roomId).then(setTasks).catch(() => {});
        } else if (event === 'quiz_update') {
          studyRoomService.getQuizzes(roomId).then(setQuizzes).catch(() => {});
        } else if (event === 'member_presence' || event === 'member_joined' || event === 'member_left') {
          studyRoomService.getRoom(roomId).then((updated) => {
            setRoom(updated);
            setMembers(updated.members || []);
          }).catch(() => {});
        }
      },
      (err) => {
        // SSE disconnected / re-establishing
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  // Derive current user's role in this room
  const currentMember = room?.members?.find(
    (m) => (typeof m.userId === 'string' ? m.userId : (m.userId as any)?._id) === currentUserId
  );
  const userRole: RoomRole = currentMember?.role || 'MEMBER';

  const handleCopyInvite = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;
    if (!window.confirm('Are you sure you want to leave this study room?')) return;
    try {
      await studyRoomService.leaveRoom(roomId);
      navigate('/study-rooms');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to leave room.');
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setIsStartingSession(true);
    try {
      await studyRoomService.startFocusSession(roomId, {
        durationMinutes: sessionDurationMinutes,
        goal: sessionCustomGoal.trim() || room?.goal,
      });
      setIsStartSessionModalOpen(false);
      fetchRoomData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to start session.');
    } finally {
      setIsStartingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-semibold">Opening study room workspace...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Room Unavailable</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {error || 'This room does not exist or you do not have permission to access it.'}
        </p>
        <button
          onClick={() => navigate('/study-rooms')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
        >
          Back to Study Rooms
        </button>
      </div>
    );
  }

  const memberCount = room.members?.length || 1;

  const isPrivate = room.privacy?.toLowerCase() === 'private';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/study-rooms')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to Study Rooms"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {room.name}
            </h1>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isPrivate
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50'
              }`}
            >
              {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {room.privacy}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 pl-8">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Goal:</span>
            <span>{room.goal}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
          {/* Ask AI Button */}
          <button
            onClick={() => setIsAIDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/80 text-violet-700 dark:text-violet-300 text-xs font-bold transition-all border border-violet-200/50 dark:border-violet-800/50"
          >
            <Bot className="w-4 h-4 text-violet-500" />
            <span>Ask AI</span>
          </button>

          {/* Copy Invite (if private) */}
          {isPrivate && room.inviteCode && (
            <button
              onClick={handleCopyInvite}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-all border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs"
              title="Copy Room Invite Code to invite peers"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Invite: <strong className="font-mono text-indigo-600 dark:text-indigo-300">{room.inviteCode}</strong></span>
                </>
              )}
            </button>
          )}

          {/* Leave Room Button */}
          {userRole !== 'OWNER' && (
            <button
              onClick={handleLeaveRoom}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Live Focus Session Bar */}
      <FocusSessionBar
        roomId={room._id}
        activeSession={room.activeSession}
        userRole={userRole}
        currentUserId={currentUserId}
        onRefreshRoom={fetchRoomData}
        onOpenStartModal={() => setIsStartSessionModalOpen(true)}
      />

      {/* Main Workspace Grid (Left Tabs, Right Members Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Tabs & Active Tab Content) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto">
            {[
              { id: 'OVERVIEW', label: 'Overview', icon: Info },
              { id: 'CHAT', label: `Chat (${messages.length})`, icon: MessageSquare },
              { id: 'RESOURCES', label: `Resources (${resources.length})`, icon: FileText },
              { id: 'TASKS', label: `Tasks (${tasks.length})`, icon: ListTodo },
              { id: 'QUIZ', label: `Quiz (${quizzes.length})`, icon: GraduationCap },
              { id: 'PROGRESS', label: 'Progress', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Room Goal Spotlight Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Room Study Target
                  </span>
                  <span className="text-xs text-slate-400">
                    Created {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {room.goal}
                </h3>

                {room.description && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {room.description}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Members</span>
                    <span className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                      {memberCount} / {room.maxMembers}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Tasks Done</span>
                    <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                      {tasks.filter((t) => t.status === 'COMPLETED').length} / {tasks.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Resources</span>
                    <span className="font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                      {resources.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Quizzes</span>
                    <span className="font-extrabold text-base text-violet-600 dark:text-violet-400">
                      {quizzes.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Tasks Summary */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-indigo-500" />
                    <span>Shared Task Checklist</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('TASKS')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tasks created yet for this room.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 4).map((task) => (
                      <div
                        key={task._id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                      >
                        <span
                          className={`font-medium ${
                            task.status === 'COMPLETED'
                              ? 'line-through text-slate-400'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'CHAT' && (
            <RoomChatTab
              roomId={room._id}
              messages={messages}
              currentUserId={currentUserId}
              userRole={userRole}
              onRefreshMessages={fetchRoomData}
            />
          )}

          {activeTab === 'RESOURCES' && (
            <RoomResourcesTab
              roomId={room._id}
              resources={resources}
              onRefreshResources={fetchRoomData}
            />
          )}

          {activeTab === 'TASKS' && (
            <RoomTasksTab
              roomId={room._id}
              tasks={tasks}
              onRefreshTasks={fetchRoomData}
            />
          )}

          {activeTab === 'QUIZ' && (
            <RoomQuizTab
              roomId={room._id}
              quizzes={quizzes}
              userRole={userRole}
              currentUserId={currentUserId}
              onRefreshQuizzes={fetchRoomData}
            />
          )}

          {activeTab === 'PROGRESS' && (
            <RoomProgressTab roomId={room._id} />
          )}
        </div>

        {/* Right Column (Members & Activity Sidebar) */}
        <div className="space-y-6">
          <RoomMembersDrawer
            room={room}
            members={members}
            currentUserId={currentUserId}
            userRole={userRole}
            onRefreshRoom={fetchRoomData}
          />
        </div>
      </div>

      {/* Start Focus Session Modal */}
      {isStartSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Start Live Focus Session</h3>
              <button
                onClick={() => setIsStartSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Session Goal
                </label>
                <input
                  type="text"
                  placeholder={room.goal}
                  value={sessionCustomGoal}
                  onChange={(e) => setSessionCustomGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Focus Duration
                </label>
                <select
                  value={sessionDurationMinutes}
                  onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value={25}>25 Minutes (Standard Pomodoro)</option>
                  <option value={45}>45 Minutes (Recommended)</option>
                  <option value={60}>60 Minutes (Deep Study)</option>
                  <option value={90}>90 Minutes (Intensive)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStartSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStartingSession}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40 flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isStartingSession ? 'Starting...' : 'Start Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ask AI Drawer */}
      <RoomAskAIDrawer
        room={room}
        resources={resources}
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        onShareToChat={() => fetchRoomData()}
      />
    </div>
  );
};
