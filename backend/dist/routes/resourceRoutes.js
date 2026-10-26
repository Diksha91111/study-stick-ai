"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_js_1 = require("../middleware/auth.js");
const resourceController_js_1 = require("../controllers/resourceController.js");
const router = (0, express_1.Router)();
// Multer memory storage with 50MB ceiling
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});
router.use(auth_js_1.authenticateToken);
router.post('/upload', upload.single('file'), resourceController_js_1.handleUpload);
router.post('/link', resourceController_js_1.handleVideoLink);
router.get('/', resourceController_js_1.getUserResources);
router.get('/:id', resourceController_js_1.getResourceById);
router.get('/:id/file', resourceController_js_1.previewResourceFile);
router.post('/:id/retry', resourceController_js_1.retryResource);
router.delete('/:id', resourceController_js_1.deleteResource);
exports.default = router;
