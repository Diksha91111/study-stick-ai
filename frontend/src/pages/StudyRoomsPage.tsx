import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { IStudyRoom } from '../types/studyRoom';
import { studyRoomService } from '../services/studyRoomService';
import { RoomCard } from '../components/study-rooms/RoomCard';
import { CreateRoomModal } from '../components/study-rooms/CreateRoomModal';
import { JoinRoomModal } from '../components/study-rooms/JoinRoomModal';
import {
  Users,
  Plus,
  KeyRound,
  Search,
  Sparkles,
  Flame,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export const StudyRoomsPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?.id || '';

  const [activeTab, setActiveTab] = useState<'MY_ROOMS' | 'ACTIVE_SESSIONS' | 'PUBLIC_ROOMS'>('MY_ROOMS');
  const [myRooms, setMyRooms] = useState<IStudyRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<IStudyRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [mine, pubs] = await Promise.all([
        studyRoomService.getMyRooms(),
        studyRoomService.getPublicRooms(),
      ]);
      setMyRooms(mine);
      setPublicRooms(pubs);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load study rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleLeaveRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to leave this study room?')) return;
    try {
      await studyRoomService.leaveRoom(roomId);
      fetchRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to leave room.');
    }
  };

  const handleArchiveRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to archive this study room? Members will no longer have access.')) return;
    try {
      await studyRoomService.archiveRoom(roomId);
      fetchRooms();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to archive room.');
    }
  };

  // Filter based on active tab and search query
  const displayedRooms = (() => {
    let list: IStudyRoom[] = [];
    if (activeTab === 'MY_ROOMS') {
      list = myRooms;
    } else if (activeTab === 'ACTIVE_SESSIONS') {
      list = myRooms.filter((r) => r.activeSession && r.activeSession.status === 'ACTIVE');
    } else if (activeTab === 'PUBLIC_ROOMS') {
      list = publicRooms;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.goal.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    );
  })();

  const activeSessionsCount = myRooms.filter(
    (r) => r.activeSession && r.activeSession.status === 'ACTIVE'
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white shadow-xl shadow-indigo-950/20 border border-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Collaborative Learning Spaces</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Study Rooms
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Study together. Stay focused. Learn better. Join peers in live focus sessions, share resources, and practice group quizzes without faking mastery.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold backdrop-blur-md border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <KeyRound className="w-4 h-4" />
              <span>Join Room</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Study Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 self-start">
          <button
            onClick={() => setActiveTab('MY_ROOMS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MY_ROOMS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            My Rooms ({myRooms.length})
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE_SESSIONS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ACTIVE_SESSIONS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Sessions ({activeSessionsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('PUBLIC_ROOMS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PUBLIC_ROOMS'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Discover Public</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search rooms or goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-semibold">Loading your study rooms...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRooms}
            className="px-4 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs"
          >
            Retry
          </button>
        </div>
      ) : displayedRooms.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === 'ACTIVE_SESSIONS'
              ? 'No Active Focus Sessions Right Now'
              : 'No Study Rooms Yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            {activeTab === 'ACTIVE_SESSIONS'
              ? 'None of your rooms currently have a running focus timer. Open any room to start one!'
              : 'Create a room or join one with an invite code to start studying collaboratively.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
            >
              Join with Code
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              + Create Room
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              currentUserId={currentUserId}
              onLeave={handleLeaveRoom}
              onArchive={handleArchiveRoom}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchRooms}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={fetchRooms}
      />
    </div>
  );
};
