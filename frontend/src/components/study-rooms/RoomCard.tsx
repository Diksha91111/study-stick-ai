import React from 'react';
import { IStudyRoom } from '../../types/studyRoom';
import { Users, Lock, Globe, Clock, ArrowRight, LogOut, Trash2, Zap, Flame, KeyRound, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoomCardProps {
  room: IStudyRoom;
  currentUserId: string;
  onLeave?: (roomId: string) => void;
  onArchive?: (roomId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, currentUserId, onLeave, onArchive }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);

  const ownerId = typeof room.ownerId === 'string' ? room.ownerId : room.ownerId?._id;
  const isOwner = ownerId === currentUserId;
  const memberCount = room.memberCount ?? room.members?.length ?? 1;
  const hasActiveSession = room.activeSession && room.activeSession.status === 'ACTIVE';
  const isPrivate = room.privacy?.toLowerCase() === 'private';

  const formatRemaining = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300/80 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isPrivate
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50'
              }`}
            >
              {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
              {room.privacy}
            </span>

            {isOwner && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Owner
              </span>
            )}

            {isPrivate && room.inviteCode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(room.inviteCode!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                title="Click to copy room invite code"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <KeyRound className="w-3 h-3 text-indigo-500" />}
                <span>{copied ? 'Copied' : room.inviteCode}</span>
              </button>
            )}
          </div>

          {/* Member Count */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {memberCount} / {room.maxMembers}
            </span>
          </div>
        </div>

        {/* Room Title & Goal */}
        <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {room.name}
        </h3>

        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {room.goal}
        </p>

        {/* Active Focus Session Banner */}
        {hasActiveSession ? (
          <div className="mt-4 p-2.5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-indigo-500/5 border border-violet-500/20 dark:border-violet-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                Live Focus Session
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-violet-700 dark:text-violet-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRemaining(room.activeSession?.remainingSeconds)}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Default duration: {room.defaultFocusDurationMinutes || 45} mins</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(`/study-rooms/${room._id}`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white text-xs font-bold transition-all duration-200 group/btn"
        >
          <span>Open Room</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>

        {isOwner ? (
          onArchive && (
            <button
              onClick={() => onArchive(room._id)}
              title="Archive room"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )
        ) : (
          onLeave && (
            <button
              onClick={() => onLeave(room._id)}
              title="Leave room"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
};
