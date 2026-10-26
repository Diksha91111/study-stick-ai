import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  StudyResource,
  IStudyResource,
  ResourceType,
} from '../../models/StudyResource.js';
import { PDFParser } from './pdfParser.js';
import { PPTXParser } from './pptxParser.js';
import { DocumentParser } from './docxParser.js';
import { ImageParser } from './imageParser.js';
import { VideoParser } from './videoParser.js';
import { ChunkingService } from './chunkingService.js';

export const STORAGE_DIR = path.resolve(process.cwd(), 'storage', 'resources');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export class ResourceService {
  /**
   * Determine resource type from extension and mime type
   */
  static determineResourceType(filename: string, mimeType: string): ResourceType {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return 'pdf';
    }
    if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation')) {
      return 'presentation';
    }
    if (['doc', 'docx', 'txt'].includes(ext) || mimeType.includes('document') || mimeType === 'text/plain') {
      return 'document';
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext) || mimeType.startsWith('image/')) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext) || mimeType.startsWith('video/')) {
      return 'video';
    }

    throw new Error(
      `Unsupported file type for "${filename}". Supported formats: PDF, PPTX, DOCX, TXT, PNG, JPG, WEBP, MP4, WEBM.`
    );
  }

  /**
   * Sanitize filename to avoid path traversal and security risks
   */
  static sanitizeFilename(name: string): string {
    const base = path.basename(name);
    return base.replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
  }

  /**
   * Process uploaded file buffer
   */
  static async processUploadedFile(
    userId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    conversationId?: string
  ): Promise<IStudyResource> {
    const cleanOriginalName = this.sanitizeFilename(file.originalname);
    const resourceType = this.determineResourceType(cleanOriginalName, file.mimetype);

    // File size limits (25MB for images/docs, 50MB for video)
    const maxSizeBytes = resourceType === 'video' ? 50 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(
        `File "${cleanOriginalName}" exceeds the maximum allowed size of ${maxSizeBytes / (1024 * 1024)}MB.`
      );
    }

    // Generate secure random filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = cleanOriginalName.split('.').pop() || '';
    const storedFilename = `${uniqueId}.${ext}`;
    const filePath = path.join(STORAGE_DIR, storedFilename);

    // Save securely to disk
    fs.writeFileSync(filePath, file.buffer);

    // Create record in PROCESSING state
    const resource = await StudyResource.create({
      userId,
      conversationId: conversationId ? new mongoose.Types.ObjectId(conversationId) : null,
      originalFilename: cleanOriginalName,
      storedFilename,
      filePath,
      mimeType: file.mimetype,
      resourceType,
      fileSizeBytes: file.size,
      processingStatus: 'PROCESSING',
      extractedText: '',
      chunks: [],
    });

    try {
      const parseResult = await this.parseFileContent(
        file.buffer,
        cleanOriginalName,
        resourceType,
        file.mimetype
      );
      resource.extractedText = parseResult.extractedText;
      resource.chunks = parseResult.chunks;
      if (parseResult.pageCount) resource.pageCount = parseResult.pageCount;
      if (parseResult.slideCount) resource.slideCount = parseResult.slideCount;
      if (parseResult.videoDuration) resource.videoDuration = parseResult.videoDuration;
      if (parseResult.metadata) resource.metadata = parseResult.metadata;
      resource.processingStatus = 'READY';

      await resource.save();
      return resource;
    } catch (err: any) {
      resource.processingStatus = 'FAILED';
      resource.failureReason = err.message || 'Processing failed.';
      await resource.save();
      return resource;
    }
  }

  /**
   * Internal parser dispatcher
   */
  private static async parseFileContent(
    buffer: Buffer,
    cleanOriginalName: string,
    resourceType: ResourceType,
    mimeType: string
  ): Promise<{
    extractedText: string;
    chunks: any[];
    pageCount?: number;
    slideCount?: number;
    videoDuration?: number;
    metadata?: Record<string, any>;
  }> {
    if (resourceType === 'pdf') {
      const result = await PDFParser.parsePDF(buffer);
      return {
        extractedText: result.extractedText,
        chunks: result.chunks,
        pageCount: result.pageCount,
      };
    } else if (resourceType === 'presentation') {
      const result = await PPTXParser.parsePPTX(buffer);
      return {
        extractedText: result.extractedText,
        chunks: result.chunks,
        slideCount: result.slideCount,
      };
    } else if (resourceType === 'document') {
      const result = await DocumentParser.parseDocument(buffer, cleanOriginalName);
      return {
        extractedText: result.extractedText,
        chunks: result.chunks,
      };
    } else if (resourceType === 'image') {
      const result = await ImageParser.parseImage(buffer, mimeType, cleanOriginalName);
      return {
        extractedText: result.extractedText,
        chunks: result.chunks,
        metadata: { base64Data: result.base64Data },
      };
    } else if (resourceType === 'video') {
      const result = await VideoParser.parseUploadedVideo(buffer, cleanOriginalName);
      return {
        extractedText: result.extractedText,
        chunks: result.chunks,
        videoDuration: result.durationSeconds,
      };
    }
    throw new Error(`Unsupported resource type: ${resourceType}`);
  }

  /**
   * Process a video link / YouTube URL
   */
  static async processVideoLink(
    userId: string,
    videoUrl: string,
    conversationId?: string
  ): Promise<IStudyResource> {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const storedFilename = `link_${uniqueId}.json`;

    const resource = await StudyResource.create({
      userId,
      conversationId: conversationId ? new mongoose.Types.ObjectId(conversationId) : null,
      originalFilename: videoUrl,
      storedFilename,
      mimeType: 'video/link',
      resourceType: 'video_link',
      fileSizeBytes: 0,
      videoUrl,
      processingStatus: 'PROCESSING',
      extractedText: '',
      chunks: [],
    });

    try {
      const result = await VideoParser.parseVideoLink(videoUrl);
      resource.extractedText = result.extractedText;
      resource.chunks = result.chunks;
      resource.processingStatus = 'READY';
      await resource.save();
      return resource;
    } catch (err: any) {
      resource.processingStatus = 'FAILED';
      resource.failureReason = err.message || 'Failed to retrieve video transcript.';
      await resource.save();
      return resource;
    }
  }

  /**
   * Get all resources belonging to user
   */
  static async getUserResources(userId: string): Promise<IStudyResource[]> {
    return await StudyResource.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get single resource with ownership verification
   */
  static async getResourceById(userId: string, resourceId: string): Promise<IStudyResource | null> {
    return await StudyResource.findOne({ _id: resourceId, userId });
  }

  /**
   * Delete resource and underlying stored file
   */
  static async deleteResource(userId: string, resourceId: string): Promise<boolean> {
    const resource = await StudyResource.findOneAndDelete({ _id: resourceId, userId });
    if (!resource) return false;

    if (resource.filePath && fs.existsSync(resource.filePath)) {
      try {
        fs.unlinkSync(resource.filePath);
      } catch (e) {
        console.error('Error removing file:', e);
      }
    }
    return true;
  }

  /**
   * Retry processing for a failed resource
   */
  static async retryResource(userId: string, resourceId: string): Promise<IStudyResource> {
    const resource = await StudyResource.findOne({ _id: resourceId, userId });
    if (!resource) {
      throw new Error('Resource not found or unauthorized.');
    }

    resource.processingStatus = 'PROCESSING';
    resource.failureReason = undefined;
    await resource.save();

    try {
      if (resource.resourceType === 'video_link' && resource.videoUrl) {
        const result = await VideoParser.parseVideoLink(resource.videoUrl);
        resource.extractedText = result.extractedText;
        resource.chunks = result.chunks;
        resource.processingStatus = 'READY';
      } else if (resource.filePath && fs.existsSync(resource.filePath)) {
        const buffer = fs.readFileSync(resource.filePath);
        const parseResult = await this.parseFileContent(
          buffer,
          resource.originalFilename,
          resource.resourceType,
          resource.mimeType
        );
        resource.extractedText = parseResult.extractedText;
        resource.chunks = parseResult.chunks;
        resource.metadata = { ...resource.metadata, ...parseResult.metadata };
        resource.processingStatus = 'READY';
      } else {
        throw new Error('Original file is no longer available on server.');
      }
      await resource.save();
      return resource;
    } catch (err: any) {
      resource.processingStatus = 'FAILED';
      resource.failureReason = err.message;
      await resource.save();
      throw err;
    }
  }

  /**
   * Retrieve relevant chunks from a list of authorized resource IDs
   */
  static async retrieveContextForQuery(
    userId: string,
    resourceIds: string[],
    query: string
  ): Promise<{
    formattedContext: string;
    sources: Array<{ resourceId: string; filename: string; page?: number; slide?: number; time?: string }>;
    inlineImages: Array<{ mimeType: string; data: string; filename: string }>;
  }> {
    if (!resourceIds || resourceIds.length === 0) {
      return { formattedContext: '', sources: [], inlineImages: [] };
    }

    const resources = await StudyResource.find({
      _id: { $in: resourceIds },
      userId,
      processingStatus: 'READY',
    });

    const sources: Array<{ resourceId: string; filename: string; page?: number; slide?: number; time?: string }> = [];
    const inlineImages: Array<{ mimeType: string; data: string; filename: string }> = [];
    let formattedContext = '';

    for (const res of resources) {
      if (res.resourceType === 'image') {
        let base64 = res.metadata?.base64Data;
        if (!base64 && res.filePath && fs.existsSync(res.filePath)) {
          base64 = fs.readFileSync(res.filePath).toString('base64');
        }
        if (base64) {
          inlineImages.push({
            mimeType: res.mimeType,
            data: base64,
            filename: res.originalFilename,
          });
        }
        sources.push({
          resourceId: res._id.toString(),
          filename: res.originalFilename,
        });
        continue;
      }

      // For documents, presentations, PDFs, transcripts: retrieve top relevant chunks
      const relevantChunks = ChunkingService.findRelevantChunks(query, res.chunks, 5);

      for (const chunk of relevantChunks) {
        let locationTag = '';
        if (chunk.pageNumber) {
          locationTag = `Page ${chunk.pageNumber}`;
        } else if (chunk.slideNumber) {
          locationTag = `Slide ${chunk.slideNumber}`;
        } else if (chunk.startTimeSeconds !== undefined) {
          const mins = Math.floor(chunk.startTimeSeconds / 60);
          const secs = String(chunk.startTimeSeconds % 60).padStart(2, '0');
          locationTag = `Timestamp ${mins}:${secs}`;
        }

        const sourceLabel = locationTag
          ? `${res.originalFilename} • ${locationTag}`
          : res.originalFilename;

        formattedContext += `\n[Source: ${sourceLabel}]\n${chunk.text}\n`;

        sources.push({
          resourceId: res._id.toString(),
          filename: res.originalFilename,
          page: chunk.pageNumber,
          slide: chunk.slideNumber,
          time: locationTag.includes('Timestamp') ? locationTag : undefined,
        });
      }
    }

    return { formattedContext: formattedContext.trim(), sources, inlineImages };
  }
}
