"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainWeakness = exports.getWeakConcepts = exports.getKnowledgeSummary = exports.getNodeDetails = exports.getKnowledgeGraph = void 0;
const response_js_1 = require("../utils/response.js");
const knowledgeGraphService_js_1 = require("../services/knowledgeGraphService.js");
/**
 * GET /api/knowledge-graph
 * Retrieve student personalized knowledge graph
 */
const getKnowledgeGraph = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const includeConcepts = req.query.includeConcepts !== 'false';
        const graph = await knowledgeGraphService_js_1.knowledgeGraphService.getKnowledgeGraph(userId, includeConcepts);
        (0, response_js_1.sendSuccess)(res, graph, 'Knowledge graph retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getKnowledgeGraph = getKnowledgeGraph;
/**
 * GET /api/knowledge-graph/node/:id
 * Retrieve single node details and performance evidence
 */
const getNodeDetails = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { id } = req.params;
        if (!id) {
            (0, response_js_1.sendError)(res, 'Node ID is required', 400);
            return;
        }
        const node = await knowledgeGraphService_js_1.knowledgeGraphService.getNodeDetails(userId, id);
        if (!node) {
            (0, response_js_1.sendError)(res, 'Node not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, node, 'Node details retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getNodeDetails = getNodeDetails;
/**
 * GET /api/knowledge-graph/summary
 * Retrieve high-level summary counts (Mastered, Learning, Weak, Available, Locked)
 */
const getKnowledgeSummary = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const graph = await knowledgeGraphService_js_1.knowledgeGraphService.getKnowledgeGraph(userId, false);
        (0, response_js_1.sendSuccess)(res, graph.summary, 'Knowledge summary retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getKnowledgeSummary = getKnowledgeSummary;
/**
 * GET /api/knowledge-graph/weak-concepts
 * Retrieve weak/revision concepts needing attention
 */
const getWeakConcepts = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const graph = await knowledgeGraphService_js_1.knowledgeGraphService.getKnowledgeGraph(userId, true);
        const weakNodes = graph.nodes.filter((n) => n.weakConcept || n.status === 'WEAK' || n.status === 'NEEDS_REVISION');
        (0, response_js_1.sendSuccess)(res, weakNodes, 'Weak concepts retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getWeakConcepts = getWeakConcepts;
/**
 * POST /api/knowledge-graph/explain-weakness
 * On-demand AI explanation for a weak concept
 */
const explainWeakness = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { topic, mastery, weakReason } = req.body;
        if (!topic) {
            (0, response_js_1.sendError)(res, 'Topic is required', 400);
            return;
        }
        const explanation = await knowledgeGraphService_js_1.knowledgeGraphService.explainWeakness(topic, mastery, weakReason);
        (0, response_js_1.sendSuccess)(res, { topic, explanation }, 'Weakness explanation generated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.explainWeakness = explainWeakness;
