"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryResource = exports.previewResourceFile = exports.deleteResource = exports.getResourceById = exports.getUserResources = exports.handleVideoLink = exports.handleUpload = void 0;
const fs_1 = __importDefault(require("fs"));
const response_js_1 = require("../utils/response.js");
const resourceService_js_1 = require("../services/resource/resourceService.js");
/**
 * Handle multipart/form-data file upload
 */
const handleUpload = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const file = req.file;
        if (!file) {
            (0, response_js_1.sendError)(res, 'No file was provided for upload.', 400);
            return;
        }
        const conversationId = req.body.conversationId;
        const resource = await resourceService_js_1.ResourceService.processUploadedFile(userId, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer,
        }, conversationId);
        (0, response_js_1.sendSuccess)(res, resource, 'File uploaded and processed', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'File upload failed', 400);
    }
};
exports.handleUpload = handleUpload;
/**
 * Handle adding a video link (e.g. YouTube)
 */
const handleVideoLink = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { videoUrl, conversationId } = req.body;
        if (!videoUrl || typeof videoUrl !== 'string') {
            (0, response_js_1.sendError)(res, 'Valid videoUrl is required.', 400);
            return;
        }
        const resource = await resourceService_js_1.ResourceService.processVideoLink(userId, videoUrl.trim(), conversationId);
        (0, response_js_1.sendSuccess)(res, resource, 'Video link processed', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to process video link', 400);
    }
};
exports.handleVideoLink = handleVideoLink;
/**
 * Get all study resources for user
 */
const getUserResources = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const resources = await resourceService_js_1.ResourceService.getUserResources(userId);
        (0, response_js_1.sendSuccess)(res, resources, 'User resources retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getUserResources = getUserResources;
/**
 * Get single study resource details
 */
const getResourceById = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const resource = await resourceService_js_1.ResourceService.getResourceById(userId, id);
        if (!resource) {
            (0, response_js_1.sendError)(res, 'Resource not found or unauthorized', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, resource, 'Resource retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getResourceById = getResourceById;
/**
 * Delete a resource
 */
const deleteResource = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const deleted = await resourceService_js_1.ResourceService.deleteResource(userId, id);
        if (!deleted) {
            (0, response_js_1.sendError)(res, 'Resource not found or unauthorized', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, { id }, 'Resource deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteResource = deleteResource;
/**
 * Stream/preview an authorized file
 */
const previewResourceFile = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const resource = await resourceService_js_1.ResourceService.getResourceById(userId, id);
        if (!resource || !resource.filePath || !fs_1.default.existsSync(resource.filePath)) {
            (0, response_js_1.sendError)(res, 'File not found or unauthorized', 404);
            return;
        }
        res.setHeader('Content-Type', resource.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resource.originalFilename)}"`);
        const stream = fs_1.default.createReadStream(resource.filePath);
        stream.pipe(res);
    }
    catch (error) {
        next(error);
    }
};
exports.previewResourceFile = previewResourceFile;
/**
 * Retry processing a failed resource
 */
const retryResource = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const resource = await resourceService_js_1.ResourceService.retryResource(userId, id);
        (0, response_js_1.sendSuccess)(res, resource, 'Resource processing retried successfully');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Retry failed', 400);
    }
};
exports.retryResource = retryResource;
