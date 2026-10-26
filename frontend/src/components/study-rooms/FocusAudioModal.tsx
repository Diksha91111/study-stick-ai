import React, { useState } from 'react';
import { useFocusAudio } from '../../context/FocusAudioContext';
import { FOCUS_AUDIO_CATALOG } from '../../services/focusAudioCatalog';
import { FocusAudioCategory, FocusAudioTrack } from '../../types/focusAudio';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  X,
  Coffee,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface FocusAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusAudioModal: React.FC<FocusAudioModalProps> = ({ isOpen, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isLooping,
    pauseOnBreak,
    pauseOnSessionEnd,
    errorMessage,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleLoop,
    setPauseOnBreak,
    setPauseOnSessionEnd,
    clearError,
  } = useFocusAudio();

  const [selectedCategory, setSelectedCategory] = useState<FocusAudioCategory | 'ALL'>('ALL');

  if (!isOpen) return null;

  const filteredTracks = selectedCategory === 'ALL'
    ? FOCUS_AUDIO_CATALOG
    : FOCUS_AUDIO_CATALOG.filter((t) => t.category === selectedCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-audio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 id="focus-audio-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Focus Audio
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  Personal to you
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an ambient environment or focus music that helps you concentrate.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Focus Audio"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-bold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Player Strip */}
        <div className="p-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Current Track details */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs shrink-0">
                {currentTrack ? currentTrack.icon : '🔇'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {currentTrack ? currentTrack.title : 'No Audio Selected'}
                  </h4>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5 text-indigo-500">
                      <span className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-indigo-500 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-indigo-500 rounded-full animate-pulse delay-150" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentTrack ? currentTrack.description : 'Select a track below to play ambient audio'}
                </p>
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center gap-2 self-center sm:self-auto">
              <button
                onClick={prevTrack}
                aria-label="Previous track"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all"
                title="Previous Sound"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={nextTrack}
                aria-label="Next track"
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all"
                title="Next Sound"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleLoop}
                aria-label={isLooping ? 'Looping enabled' : 'Looping disabled'}
                className={`p-2 rounded-xl transition-all ${
                  isLooping
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title={isLooping ? 'Loop is ON' : 'Loop is OFF'}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Volume Slider Control */}
          <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center gap-3">
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Focus audio volume"
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
            />

            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 w-9 text-right">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="px-5 pt-4 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Sounds', count: FOCUS_AUDIO_CATALOG.length },
            { id: 'NATURE', label: '🌧️ Nature' },
            { id: 'AMBIENT', label: '☕ Ambient' },
            { id: 'MUSIC', label: '🎵 Music' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {filteredTracks.map((track) => {
            const isSelected = currentTrack?.id === track.id;
            const isTrackPlaying = isSelected && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => {
                  if (isSelected && isPlaying) {
                    togglePlay();
                  } else {
                    playTrack(track.id);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playTrack(track.id);
                  }
                }}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-xs'
                    : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {isTrackPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : isSelected ? (
                      <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                    ) : (
                      <span>{track.icon}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {track.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {track.category}
                      </span>
                      {track.license && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {track.license}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {track.description}
                    </p>
                    {track.attribution && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        Source: {track.attribution}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {isTrackPlaying ? 'Playing' : 'Selected'}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Play
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Option: Stop / Silent Mode */}
          <div
            onClick={() => playTrack('')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playTrack('');
              }
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              !currentTrack
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600'
                : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                🔇
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  None (Silence)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stop and mute all background focus audio
                </p>
              </div>
            </div>
            {!currentTrack && (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Preferences Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-slate-500" />
              <div>
                <label htmlFor="pause-break-toggle" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Pause focus audio during breaks
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Temporarily mutes background audio when you take a study session break
                </p>
              </div>
            </div>
            <input
              id="pause-break-toggle"
              type="checkbox"
              checked={pauseOnBreak}
              onChange={(e) => setPauseOnBreak(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Royalty-free & Public Domain licensed audio
            </span>
            <span>Independent from Focus Timer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
