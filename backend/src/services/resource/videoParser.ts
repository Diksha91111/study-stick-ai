import { IResourceChunk } from '../../models/StudyResource.js';
import { ChunkingService } from './chunkingService.js';
import { ENV } from '../../config/env.js';

export interface VideoParseResult {
  videoUrl?: string;
  extractedText: string;
  chunks: IResourceChunk[];
  durationSeconds?: number;
}

export class VideoParser {
  static supportedVideoExtensions = ['mp4', 'webm', 'mov', 'mkv'];

  /**
   * Parse uploaded video file
   */
  static async parseUploadedVideo(buffer: Buffer, filename: string): Promise<VideoParseResult> {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext || !this.supportedVideoExtensions.includes(ext)) {
      throw new Error(`Unsupported video format .${ext}. Supported formats: MP4, WEBM, MOV, MKV.`);
    }

    // Check if transcription pipeline (e.g. Whisper API) is configured
    if (!ENV.OPENAI_API_KEY) {
      throw new Error(
        'Video transcription is not configured on this server. Video files cannot be transcribed without a configured speech-to-text service.'
      );
    }

    // If Whisper is configured, call OpenAI Whisper API
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(buffer)], { type: `video/${ext}` });
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorJson = (await response.json().catch(() => ({}))) as any;
        throw new Error(errorJson.error?.message || `Whisper API failed with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const fullTranscript = data.text || '';
      const segments = data.segments || [];

      const chunks: IResourceChunk[] = [];
      let chunkIdx = 0;

      if (segments.length > 0) {
        for (const seg of segments) {
          chunks.push({
            chunkIndex: chunkIdx++,
            text: seg.text?.trim() || '',
            startTimeSeconds: Math.floor(seg.start || 0),
            endTimeSeconds: Math.ceil(seg.end || 0),
            sectionTitle: `Timestamp: ${Math.floor(seg.start / 60)}:${String(
              Math.floor(seg.start % 60)
            ).padStart(2, '0')}`,
          });
        }
      } else {
        const textChunks = ChunkingService.splitIntoChunks(fullTranscript);
        chunks.push(...textChunks);
      }

      return {
        extractedText: fullTranscript,
        chunks,
        durationSeconds: Math.ceil(data.duration || 0),
      };
    } catch (err: any) {
      throw new Error(`Video transcription failed: ${err.message}`);
    }
  }

  /**
   * Parse video link / YouTube URL and retrieve accessible transcript
   */
  static async parseVideoLink(url: string): Promise<VideoParseResult> {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      throw new Error('Video URL cannot be empty.');
    }

    // Extract YouTube video ID
    const ytMatch = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w\-]{11})/i
    );

    if (!ytMatch || !ytMatch[1]) {
      throw new Error(
        'Invalid video URL. Please provide a supported YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)'
      );
    }

    const videoId = ytMatch[1];

    try {
      // Fetch caption track list
      const videoPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!videoPageRes.ok) {
        throw new Error('Unable to access video page.');
      }

      const html = await videoPageRes.text();

      // Look for captionTracks in playerResponse
      const playerMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
      if (!playerMatch || !playerMatch[1]) {
        throw new Error(
          'Transcript unavailable for this video link. Video transcripts cannot be invented without accessible caption tracks.'
        );
      }

      const tracks = JSON.parse(playerMatch[1]);
      if (!Array.isArray(tracks) || tracks.length === 0) {
        throw new Error(
          'Transcript unavailable for this video link. Video transcripts cannot be invented without accessible caption tracks.'
        );
      }

      // Find English or first available caption track
      const englishTrack =
        tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) ||
        tracks[0];

      if (!englishTrack?.baseUrl) {
        throw new Error(
          'Transcript unavailable for this video link. Accessible caption track URL not found.'
        );
      }

      // Fetch timedtext XML
      const captionsRes = await fetch(englishTrack.baseUrl);
      if (!captionsRes.ok) {
        throw new Error('Failed to fetch caption data from video provider.');
      }

      const xml = await captionsRes.text();

      // Parse XML items: <text start="0.5" dur="2.1">Text here</text>
      const textMatches = xml.matchAll(/<text\s+start="([\d\.]+)"(?:\s+dur="([\d\.]+)")?[^>]*>(.*?)<\/text>/gi);
      const chunks: IResourceChunk[] = [];
      let fullText = '';
      let chunkIdx = 0;

      let currentBlock = '';
      let blockStartSec = 0;
      let blockEndSec = 0;

      for (const match of textMatches) {
        const startSec = Math.floor(parseFloat(match[1]) || 0);
        const durSec = Math.ceil(parseFloat(match[2]) || 3);
        const lineText = match[3]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        if (!lineText) continue;

        if (!currentBlock) {
          blockStartSec = startSec;
        }

        currentBlock += lineText + ' ';
        blockEndSec = startSec + durSec;
        fullText += lineText + ' ';

        // Group into ~60 second or ~500 char chunks
        if (currentBlock.length > 500 || blockEndSec - blockStartSec > 60) {
          const timeLabel = `${Math.floor(blockStartSec / 60)}:${String(blockStartSec % 60).padStart(2, '0')}`;
          chunks.push({
            chunkIndex: chunkIdx++,
            text: currentBlock.trim(),
            startTimeSeconds: blockStartSec,
            endTimeSeconds: blockEndSec,
            sectionTitle: `Timestamp: ${timeLabel}`,
          });
          currentBlock = '';
        }
      }

      if (currentBlock.trim()) {
        const timeLabel = `${Math.floor(blockStartSec / 60)}:${String(blockStartSec % 60).padStart(2, '0')}`;
        chunks.push({
          chunkIndex: chunkIdx++,
          text: currentBlock.trim(),
          startTimeSeconds: blockStartSec,
          endTimeSeconds: blockEndSec,
          sectionTitle: `Timestamp: ${timeLabel}`,
        });
      }

      if (!fullText.trim()) {
        throw new Error(
          'Transcript unavailable for this video link. The caption file was empty.'
        );
      }

      return {
        videoUrl: trimmed,
        extractedText: fullText.trim(),
        chunks,
      };
    } catch (e: any) {
      if (e.message && e.message.includes('Transcript unavailable')) {
        throw e;
      }
      throw new Error(
        `Transcript unavailable for this video link. (${e.message || 'Error accessing transcript'})`
      );
    }
  }
}
