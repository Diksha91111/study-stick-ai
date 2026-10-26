import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ResourceService } from '../services/resource/resourceService.js';

/**
 * Handle multipart/form-data file upload
 */
export const handleUpload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const file = req.file;
    if (!file) {
      sendError(res, 'No file was provided for upload.', 400);
      return;
    }

    const conversationId = req.body.conversationId as string | undefined;

    const resource = await ResourceService.processUploadedFile(
      userId,
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      conversationId
    );

    sendSuccess(res, resource, 'File uploaded and processed', 201);
  } catch (error: any) {
    sendError(res, error.message || 'File upload failed', 400);
  }
};

/**
 * Handle adding a video link (e.g. YouTube)
 */
export const handleVideoLink = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { videoUrl, conversationId } = req.body;
    if (!videoUrl || typeof videoUrl !== 'string') {
      sendError(res, 'Valid videoUrl is required.', 400);
      return;
    }

    const resource = await ResourceService.processVideoLink(
      userId,
      videoUrl.trim(),
      conversationId
    );

    sendSuccess(res, resource, 'Video link processed', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to process video link', 400);
  }
};

/**
 * Get all study resources for user
 */
export const getUserResources = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const resources = await ResourceService.getUserResources(userId);
    sendSuccess(res, resources, 'User resources retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single study resource details
 */
export const getResourceById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const resource = await ResourceService.getResourceById(userId, id);

    if (!resource) {
      sendError(res, 'Resource not found or unauthorized', 404);
      return;
    }

    sendSuccess(res, resource, 'Resource retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const deleted = await ResourceService.deleteResource(userId, id);

    if (!deleted) {
      sendError(res, 'Resource not found or unauthorized', 404);
      return;
    }

    sendSuccess(res, { id }, 'Resource deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Stream/preview an authorized file
 */
export const previewResourceFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const resource = await ResourceService.getResourceById(userId, id);

    if (!resource || !resource.filePath || !fs.existsSync(resource.filePath)) {
      sendError(res, 'File not found or unauthorized', 404);
      return;
    }

    res.setHeader('Content-Type', resource.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(resource.originalFilename)}"`
    );

    const stream = fs.createReadStream(resource.filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Retry processing a failed resource
 */
export const retryResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const resource = await ResourceService.retryResource(userId, id);
    sendSuccess(res, resource, 'Resource processing retried successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Retry failed', 400);
  }
};
