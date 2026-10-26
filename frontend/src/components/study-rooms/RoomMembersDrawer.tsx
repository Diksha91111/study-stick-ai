import React, { useState } from 'react';
import { IRoomMember, RoomRole, MemberPresence, IStudyRoom } from '../../types/studyRoom';
import {
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Copy,
  Check,
  MoreVertical,
  KeyRound,
  RefreshCw,
  X,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';

interface RoomMembersDrawerProps {
  room: IStudyRoom;
  members: IRoomMember[];
  currentUserId: string;
  userRole: RoomRole;
  onRefreshRoom: () => void;
  onClose?: () => void;
}

export const RoomMembersDrawer: React.FC<RoomMembersDrawerProps> = ({
  room,
  members,
  currentUserId,
  userRole,
  onRefreshRoom,
  onClose,
}) => {
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);

  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const canModerate = isOwner || isAdmin;

  const handleCopyInvite = () => {
    if (room.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  const handleRegenerateInvite = async () => {
    setIsRegenerating(true);
    try {
      await studyRoomService.regenerateInvite(room._id);
      onRefreshRoom();
    } catch (err: any) {
      console.error('Failed to regenerate invite:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: RoomRole) => {
    try {
      await studyRoomService.updateMemberRole(room._id, targetUserId, newRole);
      setActionMenuUserId(null);
      onRefreshRoom();
    } catch (err: any) {
      console.error('Role update failed:', err);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the study room?')) return;
    try {
      await studyRoomService.removeMember(room._id, targetUserId);
      setActionMenuUserId(null);
      onRefreshRoom();
    } catch (err: any) {
      console.error('Remove member failed:', err);
    }
  };

  const getPresenceBadge = (presence: MemberPresence) => {
    switch (presence) {
      case 'STUDYING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Studying
          </span>
        );
      case 'BREAK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            On Break
          </span>
        );
      case 'ONLINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  };

  const getRoleBadge = (role: RoomRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
            Owner
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/50">
            Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Room Members ({members.length})
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Invite Code Bar (for Private Rooms) */}
      {(room.privacy?.toLowerCase() === 'private') && room.inviteCode && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              Invite Code
            </span>

            {isOwner && (
              <button
                onClick={handleRegenerateInvite}
                disabled={isRegenerating}
                title="Regenerate invite code"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-300 text-center select-all">
              {room.inviteCode}
            </code>
            <button
              onClick={handleCopyInvite}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
              title="Copy code"
            >
              {copiedInvite ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="p-3 sm:p-4 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[460px] overflow-y-auto">
        {members.map((member) => {
          const mUserId = typeof member.userId === 'string' ? member.userId : member.userId?._id;
          const mName = typeof member.userId === 'string' ? 'Member' : member.userId?.name || 'Peer';
          const isCurrentUser = mUserId === currentUserId;
          const isTargetOwner = member.role === 'OWNER';
          const isTargetAdmin = member.role === 'ADMIN';

          return (
            <div key={mUserId} className="py-3 flex items-center justify-between gap-3 group relative">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                  {mName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {mName}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-slate-400 font-medium">(You)</span>
                    )}
                    {getRoleBadge(member.role)}
                  </div>
                  <div className="mt-0.5">{getPresenceBadge(member.presence)}</div>
                </div>
              </div>

              {/* Moderation Controls (Owner/Admin) */}
              {canModerate && !isTargetOwner && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setActionMenuUserId(actionMenuUserId === mUserId ? null : mUserId)
                    }
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {actionMenuUserId === mUserId && (
                    <div className="absolute right-0 top-8 z-30 w-36 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 space-y-1 text-xs">
                      {isOwner && (
                        <button
                          onClick={() => handleRoleChange(mUserId, isTargetAdmin ? 'MEMBER' : 'ADMIN')}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{isTargetAdmin ? 'Demote' : 'Make Admin'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveMember(mUserId)}
                        className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
