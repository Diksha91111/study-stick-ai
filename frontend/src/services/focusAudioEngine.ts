import { FocusAudioTrack } from '../types/focusAudio';

type StateChangeCallback = (isPlaying: boolean, currentTrack: FocusAudioTrack | null) => void;
type ErrorCallback = (message: string | null) => void;

class FocusAudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private synthGainNode: GainNode | null = null;
  private activeSynthNodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];
  
  private currentTrack: FocusAudioTrack | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.35; // default 35%
  private isMuted: boolean = false;
  private isLooping: boolean = true;

  private onStateChange: StateChangeCallback | null = null;
  private onError: ErrorCallback | null = null;

  constructor() {
    // Audio elements will be initialized upon user gesture
  }

  public subscribe(onStateChange: StateChangeCallback, onError: ErrorCallback): () => void {
    this.onStateChange = onStateChange;
    this.onError = onError;
    return () => {
      this.onStateChange = null;
      this.onError = null;
    };
  }

  public getEffectiveVolume(): number {
    return this.isMuted ? 0 : this.volume;
  }

  public setVolume(volumeFraction: number) {
    this.volume = Math.max(0, Math.min(1, volumeFraction));
    const effective = this.getEffectiveVolume();

    if (this.audioElement) {
      this.audioElement.volume = effective;
    }
    if (this.synthGainNode && this.audioContext) {
      this.synthGainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.synthGainNode.gain.setValueAtTime(effective, this.audioContext.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  public setLooping(loop: boolean) {
    this.isLooping = loop;
    if (this.audioElement) {
      this.audioElement.loop = loop;
    }
  }

  public async playTrack(track: FocusAudioTrack): Promise<void> {
    try {
      this.onError?.(null);

      // Stop previous playback first
      this.stopCurrent();

      this.currentTrack = track;

      if (track.type === 'audio-file') {
        await this.playAudioFile(track.source);
      } else if (track.type === 'synthesizer') {
        await this.playSynthesizer(track.source);
      }

      this.isPlaying = true;
      this.onStateChange?.(true, this.currentTrack);
    } catch (err: any) {
      console.warn('Focus Audio playback error:', err);
      this.stopCurrent();
      this.onError?.(
        err?.message?.includes('user gesture') || err?.name === 'NotAllowedError'
          ? 'Playback blocked: please interact with the page first.'
          : 'Unable to play this focus sound. Check device audio output.'
      );
    }
  }

  public async resume(): Promise<void> {
    if (!this.currentTrack) return;
    if (this.isPlaying) return;

    try {
      this.onError?.(null);
      if (this.currentTrack.type === 'audio-file') {
        if (!this.audioElement) {
          await this.playAudioFile(this.currentTrack.source);
        } else {
          await this.audioElement.play();
        }
      } else if (this.currentTrack.type === 'synthesizer') {
        await this.playSynthesizer(this.currentTrack.source);
      }
      this.isPlaying = true;
      this.onStateChange?.(true, this.currentTrack);
    } catch (err: any) {
      console.warn('Failed to resume focus audio:', err);
      this.onError?.('Unable to resume audio.');
    }
  }

  public pause(): void {
    if (!this.isPlaying) return;

    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.audioContext && this.synthGainNode) {
      // Fade out synth smoothly
      try {
        this.synthGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      } catch (e) {}
      this.stopSynth();
    }

    this.isPlaying = false;
    this.onStateChange?.(false, this.currentTrack);
  }

  public stop(): void {
    this.stopCurrent();
    this.currentTrack = null;
    this.isPlaying = false;
    this.onStateChange?.(false, null);
  }

  private stopCurrent(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.src = '';
        this.audioElement.load();
      } catch (e) {}
      this.audioElement = null;
    }
    this.stopSynth();
  }

  private stopSynth(): void {
    for (const node of this.activeSynthNodes) {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (e) {}
    }
    this.activeSynthNodes = [];
  }

  private async playAudioFile(src: string): Promise<void> {
    const audio = new Audio();
    audio.src = src;
    audio.loop = this.isLooping;
    audio.volume = this.getEffectiveVolume();
    audio.preload = 'auto';

    audio.onerror = () => {
      this.onError?.('Focus audio file failed to load.');
      this.stop();
    };

    audio.onended = () => {
      if (!this.isLooping) {
        this.isPlaying = false;
        this.onStateChange?.(false, this.currentTrack);
      }
    };

    this.audioElement = audio;
    await audio.play();
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private async playSynthesizer(sourceType: string): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    this.synthGainNode = ctx.createGain();
    this.synthGainNode.gain.setValueAtTime(this.getEffectiveVolume(), ctx.currentTime);
    this.synthGainNode.connect(ctx.destination);

    if (sourceType === 'procedural-lofi') {
      // High-grade warm Lo-fi Brown Noise Generator
      const bufferSize = ctx.sampleRate * 5; // 5 seconds of seamless noise buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise integration filter
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Lowpass filter for warm, relaxing acoustic depth
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(450, ctx.currentTime);
      lowpass.Q.setValueAtTime(1.0, ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(this.synthGainNode);

      noiseSource.start();
      this.activeSynthNodes = [noiseSource, lowpass, this.synthGainNode];
    } else if (sourceType === 'procedural-alpha') {
      // 432 Hz Alpha Harmonic Binaural Drone
      // Carrier 432 Hz, offset 442 Hz (10 Hz alpha wave beat)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(442, ctx.currentTime);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.35, ctx.currentTime); // Soft master mix

      osc1.connect(subGain);
      osc2.connect(subGain);
      subGain.connect(this.synthGainNode);

      osc1.start();
      osc2.start();
      this.activeSynthNodes = [osc1, osc2, subGain, this.synthGainNode];
    }
  }

  public getTrack(): FocusAudioTrack | null {
    return this.currentTrack;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const focusAudioEngine = new FocusAudioEngine();
