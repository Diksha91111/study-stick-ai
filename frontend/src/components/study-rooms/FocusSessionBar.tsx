import React, { useState, useEffect, useRef } from 'react';
import { IActiveFocusSession, RoomRole } from '../../types/studyRoom';
import {
  Play,
  Pause,
  Square,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Flame,
  Headphones,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';
import { useFocusAudio } from '../../context/FocusAudioContext';
import { FocusAudioModal } from './FocusAudioModal';

interface FocusSessionBarProps {
  roomId: string;
  activeSession: IActiveFocusSession | null | undefined;
  userRole: RoomRole;
  currentUserId: string;
  onRefreshRoom: () => void;
  onOpenStartModal?: () => void;
}

export const FocusSessionBar: React.FC<FocusSessionBarProps> = ({
  roomId,
  activeSession,
  userRole,
  currentUserId,
  onRefreshRoom,
  onOpenStartModal,
}) => {
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const {
    currentTrack,
    isPlaying: isAudioPlaying,
    togglePlay: toggleAudioPlay,
    isMuted: isAudioMuted,
    toggleMute: toggleAudioMute,
    pauseOnBreak,
    pauseOnSessionEnd,
    pause: pauseAudio,
    resume: resumeAudio,
  } = useFocusAudio();

  // Sync remaining seconds with activeSession
  useEffect(() => {
    if (!activeSession) {
      setRemainingSecs(0);
      return;
    }

    setRemainingSecs(Math.max(0, activeSession.remainingSeconds ?? 0));

    // Only tick down if ACTIVE or RUNNING (not PAUSED)
    if (activeSession.status !== 'ACTIVE' && (activeSession.status as any) !== 'RUNNING') return;

    const interval = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRefreshRoom();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.status, activeSession?.remainingSeconds, activeSession?.sessionId]);

  const canControl = userRole === 'OWNER' || userRole === 'ADMIN';

  // Find current user's participant status
  const currentParticipant = activeSession?.participants?.find(
    (p) => (typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id) === currentUserId
  );
  const isParticipant = !!currentParticipant && currentParticipant.status !== 'LEFT';
  const isOnBreak = currentParticipant?.status === 'BREAK';

  // Automatic break pause/resume integration
  const wasPlayingBeforeBreakRef = useRef(false);
  useEffect(() => {
    if (pauseOnBreak) {
      if (isOnBreak && isAudioPlaying) {
        wasPlayingBeforeBreakRef.current = true;
        pauseAudio();
      } else if (!isOnBreak && wasPlayingBeforeBreakRef.current) {
        wasPlayingBeforeBreakRef.current = false;
        resumeAudio().catch(() => {});
      }
    }
  }, [isOnBreak, pauseOnBreak, isAudioPlaying, pauseAudio, resumeAudio]);

  // Session completion pause integration
  const prevSessionStatusRef = useRef(activeSession?.status);
  useEffect(() => {
    const prev = prevSessionStatusRef.current;
    const current = activeSession?.status;
    prevSessionStatusRef.current = current;

    if (
      pauseOnSessionEnd &&
      ((prev as any) === 'ACTIVE' || (prev as any) === 'RUNNING' || (prev as any) === 'PAUSED') &&
      (current === 'COMPLETED' || current === 'CANCELLED' || !current)
    ) {
      pauseAudio();
    }
  }, [activeSession?.status, pauseOnSessionEnd, pauseAudio]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleControlAction = async (action: 'PAUSE' | 'RESUME' | 'END') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await studyRoomService.controlFocusSession(roomId, action);
      onRefreshRoom();
    } catch (err: any) {
      console.error('Failed to control session:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParticipantAction = async (action: 'JOIN' | 'BREAK' | 'RESUME' | 'LEAVE') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await studyRoomService.participantFocusAction(roomId, action);
      onRefreshRoom();
    } catch (err: any) {
      console.error('Participant action failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeSession || activeSession.status === 'COMPLETED' || activeSession.status === 'CANCELLED') {
    return (
      <>
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Focus Session</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Start a synchronized Pomodoro/Focus timer to study together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Focus Audio Button */}
            <button
              onClick={() => setIsAudioModalOpen(true)}
              aria-label="Open Focus Audio settings"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isAudioPlaying
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <Headphones className={`w-3.5 h-3.5 ${isAudioPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>Focus Audio</span>
              {currentTrack && (
                <span className="hidden sm:inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold ml-0.5">
                  <span>•</span>
                  <span>{currentTrack.icon}</span>
                  <span className="max-w-[70px] truncate">{currentTrack.title}</span>
                </span>
              )}
            </button>

            {/* Quick Mini Player */}
            {currentTrack && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <button
                  onClick={toggleAudioPlay}
                  aria-label={isAudioPlaying ? 'Pause focus audio' : 'Play focus audio'}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  title={isAudioPlaying ? 'Pause' : 'Play'}
                >
                  {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={toggleAudioMute}
                  aria-label={isAudioMuted ? 'Unmute focus audio' : 'Mute focus audio'}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                >
                  {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {canControl && onOpenStartModal && (
              <button
                onClick={onOpenStartModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Focus Session</span>
              </button>
            )}
          </div>
        </div>

        <FocusAudioModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
        />
      </>
    );
  }

  const studyingCount = activeSession.participants?.filter((p) => p.status === 'STUDYING').length || 0;
  const breakCount = activeSession.participants?.filter((p) => p.status === 'BREAK').length || 0;

  const isRunning = activeSession.status === 'ACTIVE' || (activeSession.status as any) === 'RUNNING';

  return (
    <>
      <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-indigo-900/90 via-violet-900/90 to-purple-950/90 text-white shadow-xl shadow-indigo-900/20 border border-indigo-500/30">
        {/* Background ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Session Info & Goal */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-indigo-200 border border-white/15">
                <span className="relative flex h-2 w-2">
                  {isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isRunning ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                </span>
                <span>{isRunning ? 'Focus Session Active' : 'Session Paused'}</span>
              </span>

              <span className="text-xs text-indigo-200/80 font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{studyingCount} Studying</span>
                {breakCount > 0 && <span className="opacity-70"> • {breakCount} on break</span>}
              </span>
            </div>

            <h3 className="text-base font-extrabold tracking-tight text-white line-clamp-1">
              {activeSession.goal || 'Collaborative Study Session'}
            </h3>
          </div>

          {/* Center: Live Timer Display & Focus Audio Compact Mini Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 self-center lg:self-auto">
            <div className="px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center gap-3">
              <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
              <span className="font-mono text-3xl font-black tracking-wider text-white">
                {formatTimer(remainingSecs)}
              </span>
            </div>

            {/* Focus Audio Toggle & Mini Player */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAudioModalOpen(true)}
                aria-label="Configure Focus Audio"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border backdrop-blur-md ${
                  isAudioPlaying
                    ? 'bg-indigo-500/40 text-white border-indigo-400/50 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-indigo-100 border-white/15'
                }`}
                title="Personal background focus audio"
              >
                <Headphones className={`w-3.5 h-3.5 ${isAudioPlaying ? 'text-indigo-300 animate-pulse' : 'text-indigo-200'}`} />
                <span>Focus Audio</span>
                {currentTrack && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-indigo-200 font-medium">
                    <span>•</span>
                    <span>{currentTrack.icon}</span>
                    <span className="max-w-[75px] truncate">{currentTrack.title}</span>
                  </span>
                )}
              </button>

              {currentTrack && (
                <div className="flex items-center gap-1 px-1.5 py-1 rounded-xl bg-black/25 border border-white/10 backdrop-blur-md">
                  <button
                    onClick={toggleAudioPlay}
                    aria-label={isAudioPlaying ? 'Pause focus audio' : 'Play focus audio'}
                    className="p-1 rounded-lg hover:bg-white/15 text-white transition-colors"
                    title={isAudioPlaying ? 'Pause focus audio' : 'Play focus audio'}
                  >
                    {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={toggleAudioMute}
                    aria-label={isAudioMuted ? 'Unmute focus audio' : 'Mute focus audio'}
                    className="p-1 rounded-lg hover:bg-white/15 text-indigo-200 hover:text-white transition-colors"
                    title={isAudioMuted ? 'Unmute' : 'Mute'}
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-300" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls & Participant Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Member actions */}
            {!isParticipant ? (
              <button
                onClick={() => handleParticipantAction('JOIN')}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
              >
                Join Session
              </button>
            ) : isOnBreak ? (
              <button
                onClick={() => handleParticipantAction('RESUME')}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
              >
                End Break & Resume
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleParticipantAction('BREAK')}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 text-xs font-semibold backdrop-blur-md border border-white/15 transition-all flex items-center gap-1.5"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Take Break</span>
                </button>
                <button
                  onClick={() => handleParticipantAction('LEAVE')}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-rose-200 hover:text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all"
                >
                  Leave
                </button>
              </div>
            )}

            {/* Owner/Admin Session Controls */}
            {canControl && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/20">
                {isRunning ? (
                  <button
                    onClick={() => handleControlAction('PAUSE')}
                    disabled={isProcessing}
                    title="Pause timer for everyone"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleControlAction('RESUME')}
                    disabled={isProcessing}
                    title="Resume timer"
                    className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                )}

                <button
                  onClick={() => handleControlAction('END')}
                  disabled={isProcessing}
                  title="End focus session"
                  className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <FocusAudioModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </>
  );
};
