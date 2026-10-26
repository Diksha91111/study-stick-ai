"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const knowledgeGraphController_js_1 = require("../controllers/knowledgeGraphController.js");
const router = (0, express_1.Router)();
// Apply authentication middleware to all knowledge-graph routes
router.use(auth_js_1.requireAuth);
router.get('/', knowledgeGraphController_js_1.getKnowledgeGraph);
router.get('/summary', knowledgeGraphController_js_1.getKnowledgeSummary);
router.get('/weak-concepts', knowledgeGraphController_js_1.getWeakConcepts);
router.get('/node/:id', knowledgeGraphController_js_1.getNodeDetails);
router.post('/explain-weakness', knowledgeGraphController_js_1.explainWeakness);
exports.default = router;
