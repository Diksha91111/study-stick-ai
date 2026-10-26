import { IResourceChunk } from '../../models/StudyResource.js';
import { ENV } from '../../config/env.js';

export interface ImageParseResult {
  mimeType: string;
  base64Data: string;
  extractedText: string;
  chunks: IResourceChunk[];
  hasVisionSupport: boolean;
}

export class ImageParser {
  static supportedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  static isSupported(mimeType: string): boolean {
    return this.supportedMimeTypes.includes(mimeType.toLowerCase());
  }

  static async parseImage(buffer: Buffer, mimeType: string, filename: string): Promise<ImageParseResult> {
    if (!this.isSupported(mimeType)) {
      throw new Error(`Unsupported image format: ${mimeType}. Please upload PNG, JPG, JPEG, or WEBP.`);
    }

    const base64Data = buffer.toString('base64');
    const hasVisionSupport = Boolean(ENV.GEMINI_API_KEY || ENV.OPENAI_API_KEY || ENV.ANTHROPIC_API_KEY);

    if (!hasVisionSupport) {
      throw new Error('AI Vision model is not configured. Visual analysis is unavailable.');
    }

    const placeholderText = `[Uploaded Image Resource: ${filename} (${mimeType})]`;
    const chunks: IResourceChunk[] = [
      {
        chunkIndex: 0,
        text: placeholderText,
        sectionTitle: `Image: ${filename}`,
      },
    ];

    return {
      mimeType,
      base64Data,
      extractedText: placeholderText,
      chunks,
      hasVisionSupport,
    };
  }
}
