import React, { useState, useEffect } from 'react';
import { IRoomProgress } from '../../types/studyRoom';
import {
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  Users,
  Flame,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';

interface RoomProgressTabProps {
  roomId: string;
}

export const RoomProgressTab: React.FC<RoomProgressTabProps> = ({ roomId }) => {
  const [progress, setProgress] = useState<IRoomProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const data = await studyRoomService.getProgress(roomId);
      setProgress(data);
    } catch (err: any) {
      console.error('Failed to load room progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
        <p className="text-xs">Computing persisted progress metrics...</p>
      </div>
    );
  }

  const my = progress?.myProgress || {
    focusTimeMinutes: 0,
    completedSessions: 0,
    tasksCompleted: 0,
    quizzesAttempted: 0,
    averageQuizScore: 0,
    resourcesShared: 0,
  };

  const room = progress?.roomActivity || {
    totalSessions: 0,
    totalFocusTimeMinutes: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    totalQuizzes: 0,
    totalMembers: 0,
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: MY INDIVIDUAL PROGRESS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">My Study Contribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your verified study metrics inside this room.
              </p>
            </div>
          </div>
          <button
            onClick={fetchProgress}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Focus Time</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.focusTimeMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Live focus sessions attended</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Sessions Completed</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.completedSessions}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Full sessions completed</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Tasks Completed</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.tasksCompleted}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Room tasks checked off</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <Award className="w-4 h-4 text-violet-500" />
              <span>Quizzes Attempted</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.quizzesAttempted}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Individual assessments</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <span>Avg Quiz Score</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.averageQuizScore}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Average performance</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
              <BookOpen className="w-4 h-4 text-rose-500" />
              <span>Resources Shared</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {my.resourcesShared}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Shared with members</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: ROOM-WIDE ACTIVITY */}
      <div className="space-y-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Room-Wide Aggregate Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Collective effort and productivity across all active members.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Study Time</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {room.totalFocusTimeMinutes} mins
            </span>
            <p className="text-[10px] text-slate-400 mt-1">{room.totalSessions} total sessions</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Tasks Completed</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {room.tasksCompleted} / {room.totalTasks}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">
              {room.totalTasks > 0 ? Math.round((room.tasksCompleted / room.totalTasks) * 100) : 0}% completion
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Quizzes Launched</span>
            <span className="text-xl font-black text-violet-600 dark:text-violet-400">
              {room.totalQuizzes}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Curriculum challenges</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Members</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-200">
              {room.totalMembers}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">Collaborating peers</p>
          </div>
        </div>
      </div>
    </div>
  );
};
