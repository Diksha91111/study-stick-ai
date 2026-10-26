import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { FocusAudioTrack, FocusAudioPreferences } from '../types/focusAudio';
import { FOCUS_AUDIO_CATALOG, getTrackById } from '../services/focusAudioCatalog';
import { focusAudioEngine } from '../services/focusAudioEngine';

const STORAGE_KEY = 'studystick_focus_audio_prefs';

const DEFAULT_PREFERENCES: FocusAudioPreferences = {
  selectedTrackId: 'rain',
  volume: 35, // Safe moderate starting volume (0-100)
  isMuted: false,
  isLooping: true,
  pauseOnBreak: true,
  pauseOnSessionEnd: false,
};

interface FocusAudioContextType {
  currentTrack: FocusAudioTrack | null;
  isPlaying: boolean;
  volume: number; // 0 - 100
  isMuted: boolean;
  isLooping: boolean;
  pauseOnBreak: boolean;
  pauseOnSessionEnd: boolean;
  errorMessage: string | null;

  playTrack: (trackId: string) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  setPauseOnBreak: (enabled: boolean) => void;
  setPauseOnSessionEnd: (enabled: boolean) => void;
  clearError: () => void;
}

const FocusAudioContext = createContext<FocusAudioContextType | undefined>(undefined);

export const FocusAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load preferences from localStorage safely
  const [preferences, setPreferences] = useState<FocusAudioPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          volume: typeof parsed.volume === 'number' ? Math.max(0, Math.min(100, parsed.volume)) : 35,
        };
      }
    } catch (e) {
      console.warn('Failed to parse focus audio preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [currentTrack, setCurrentTrack] = useState<FocusAudioTrack | null>(() => {
    return getTrackById(preferences.selectedTrackId) || FOCUS_AUDIO_CATALOG[0];
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync engine initial settings from preferences (NO AUTOPLAY)
  useEffect(() => {
    focusAudioEngine.setVolume(preferences.volume / 100);
    focusAudioEngine.setMuted(preferences.isMuted);
    focusAudioEngine.setLooping(preferences.isLooping);

    const unsubscribe = focusAudioEngine.subscribe(
      (playing, track) => {
        setIsPlaying(playing);
        if (track) setCurrentTrack(track);
      },
      (error) => {
        setErrorMessage(error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Save preferences changes to localStorage
  const updatePreferences = useCallback((updater: (prev: FocusAudioPreferences) => FocusAudioPreferences) => {
    setPreferences((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const playTrack = useCallback(async (trackId: string) => {
    const track = getTrackById(trackId);
    if (!track) {
      // "None" option stops audio
      focusAudioEngine.stop();
      setCurrentTrack(null);
      updatePreferences((p) => ({ ...p, selectedTrackId: null }));
      return;
    }

    setCurrentTrack(track);
    updatePreferences((p) => ({ ...p, selectedTrackId: track.id }));
    await focusAudioEngine.playTrack(track);
  }, [updatePreferences]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      focusAudioEngine.pause();
    } else {
      if (currentTrack) {
        await focusAudioEngine.resume();
      } else if (FOCUS_AUDIO_CATALOG.length > 0) {
        await playTrack(FOCUS_AUDIO_CATALOG[0].id);
      }
    }
  }, [isPlaying, currentTrack, playTrack]);

  const pause = useCallback(() => {
    focusAudioEngine.pause();
  }, []);

  const resume = useCallback(async () => {
    if (currentTrack) {
      await focusAudioEngine.resume();
    }
  }, [currentTrack]);

  const stop = useCallback(() => {
    focusAudioEngine.stop();
  }, []);

  const nextTrack = useCallback(async () => {
    const currentIndex = currentTrack ? FOCUS_AUDIO_CATALOG.findIndex((t) => t.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % FOCUS_AUDIO_CATALOG.length;
    await playTrack(FOCUS_AUDIO_CATALOG[nextIndex].id);
  }, [currentTrack, playTrack]);

  const prevTrack = useCallback(async () => {
    const currentIndex = currentTrack ? FOCUS_AUDIO_CATALOG.findIndex((t) => t.id === currentTrack.id) : 0;
    const prevIndex = (currentIndex - 1 + FOCUS_AUDIO_CATALOG.length) % FOCUS_AUDIO_CATALOG.length;
    await playTrack(FOCUS_AUDIO_CATALOG[prevIndex].id);
  }, [currentTrack, playTrack]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    updatePreferences((p) => ({ ...p, volume: clamped }));
    focusAudioEngine.setVolume(clamped / 100);
  }, [updatePreferences]);

  const toggleMute = useCallback(() => {
    updatePreferences((p) => {
      const nextMuted = !p.isMuted;
      focusAudioEngine.setMuted(nextMuted);
      return { ...p, isMuted: nextMuted };
    });
  }, [updatePreferences]);

  const toggleLoop = useCallback(() => {
    updatePreferences((p) => {
      const nextLooping = !p.isLooping;
      focusAudioEngine.setLooping(nextLooping);
      return { ...p, isLooping: nextLooping };
    });
  }, [updatePreferences]);

  const setPauseOnBreak = useCallback((enabled: boolean) => {
    updatePreferences((p) => ({ ...p, pauseOnBreak: enabled }));
  }, [updatePreferences]);

  const setPauseOnSessionEnd = useCallback((enabled: boolean) => {
    updatePreferences((p) => ({ ...p, pauseOnSessionEnd: enabled }));
  }, [updatePreferences]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const contextValue = useMemo<FocusAudioContextType>(() => ({
    currentTrack,
    isPlaying,
    volume: preferences.volume,
    isMuted: preferences.isMuted,
    isLooping: preferences.isLooping,
    pauseOnBreak: preferences.pauseOnBreak,
    pauseOnSessionEnd: preferences.pauseOnSessionEnd,
    errorMessage,
    playTrack,
    togglePlay,
    pause,
    resume,
    stop,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleLoop,
    setPauseOnBreak,
    setPauseOnSessionEnd,
    clearError,
  }), [
    currentTrack,
    isPlaying,
    preferences,
    errorMessage,
    playTrack,
    togglePlay,
    pause,
    resume,
    stop,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleLoop,
    setPauseOnBreak,
    setPauseOnSessionEnd,
    clearError,
  ]);

  return (
    <FocusAudioContext.Provider value={contextValue}>
      {children}
    </FocusAudioContext.Provider>
  );
};

export const useFocusAudio = (): FocusAudioContextType => {
  const context = useContext(FocusAudioContext);
  if (!context) {
    throw new Error('useFocusAudio must be used within a FocusAudioProvider');
  }
  return context;
};
