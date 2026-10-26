export type FocusAudioCategory = 'NATURE' | 'AMBIENT' | 'MUSIC';

export interface FocusAudioTrack {
  id: string;
  title: string;
  category: FocusAudioCategory;
  icon: string;
  source: string;
  type: 'audio-file' | 'synthesizer';
  durationMinutes?: number;
  attribution?: string;
  license?: string;
  description: string;
}

export interface FocusAudioPreferences {
  selectedTrackId: string | null;
  volume: number; // 0 - 100
  isMuted: boolean;
  isLooping: boolean;
  pauseOnBreak: boolean;
  pauseOnSessionEnd: boolean;
}
