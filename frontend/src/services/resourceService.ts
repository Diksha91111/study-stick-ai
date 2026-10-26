import api from './api';

export type ResourceProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';

export type ResourceType =
  | 'pdf'
  | 'pptx'
  | 'docx'
  | 'txt'
  | 'image'
  | 'video'
  | 'video_link';

export interface StudyResourceItem {
  _id: string;
  userId: string;
  conversationId?: string;
  originalFilename: string;
  storedFilename?: string;
  resourceType: ResourceType;
  mimeType?: string;
  fileSize: number;
  videoUrl?: string;
  processingStatus: ResourceProcessingStatus;
  errorMessage?: string;
  metadata?: {
    pageCount?: number;
    slideCount?: number;
    durationSeconds?: number;
    hasVisualData?: boolean;
    isScanned?: boolean;
    wordCount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const resourceService = {
  /**
   * Upload study material (PDF, PPTX, DOCX, TXT, Image, Video)
   */
  uploadFile: async (
    file: File,
    conversationId?: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<StudyResourceItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const response = await api.post('/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data.data;
  },

  /**
   * Add a video link (e.g. YouTube URL)
   */
  addVideoLink: async (
    url: string,
    conversationId?: string
  ): Promise<StudyResourceItem> => {
    const response = await api.post('/resources/link', {
      url,
      conversationId,
    });
    return response.data.data;
  },

  /**
   * Get all study resources for user (optionally scoped to conversation)
   */
  getResources: async (conversationId?: string): Promise<StudyResourceItem[]> => {
    const params: Record<string, string> = {};
    if (conversationId) {
      params.conversationId = conversationId;
    }
    const response = await api.get('/resources', { params });
    return response.data.data;
  },

  /**
   * Get a single resource by ID
   */
  getResource: async (id: string): Promise<StudyResourceItem> => {
    const response = await api.get(`/resources/${id}`);
    return response.data.data;
  },

  /**
   * Delete a study resource
   */
  deleteResource: async (id: string): Promise<void> => {
    await api.delete(`/resources/${id}`);
  },

  /**
   * Retry processing for a failed resource
   */
  retryResource: async (id: string): Promise<StudyResourceItem> => {
    const response = await api.post(`/resources/${id}/retry`);
    return response.data.data;
  },
};
