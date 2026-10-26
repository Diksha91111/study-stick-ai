import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { knowledgeGraphService } from '../services/knowledgeGraphService.js';

/**
 * GET /api/knowledge-graph
 * Retrieve student personalized knowledge graph
 */
export const getKnowledgeGraph = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const includeConcepts = req.query.includeConcepts !== 'false';
    const graph = await knowledgeGraphService.getKnowledgeGraph(userId, includeConcepts);

    sendSuccess(res, graph, 'Knowledge graph retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/knowledge-graph/node/:id
 * Retrieve single node details and performance evidence
 */
export const getNodeDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { id } = req.params;
    if (!id) {
      sendError(res, 'Node ID is required', 400);
      return;
    }

    const node = await knowledgeGraphService.getNodeDetails(userId, id);
    if (!node) {
      sendError(res, 'Node not found', 404);
      return;
    }

    sendSuccess(res, node, 'Node details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/knowledge-graph/summary
 * Retrieve high-level summary counts (Mastered, Learning, Weak, Available, Locked)
 */
export const getKnowledgeSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const graph = await knowledgeGraphService.getKnowledgeGraph(userId, false);
    sendSuccess(res, graph.summary, 'Knowledge summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/knowledge-graph/weak-concepts
 * Retrieve weak/revision concepts needing attention
 */
export const getWeakConcepts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const graph = await knowledgeGraphService.getKnowledgeGraph(userId, true);
    const weakNodes = graph.nodes.filter((n) => n.weakConcept || n.status === 'WEAK' || n.status === 'NEEDS_REVISION');

    sendSuccess(res, weakNodes, 'Weak concepts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/knowledge-graph/explain-weakness
 * On-demand AI explanation for a weak concept
 */
export const explainWeakness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { topic, mastery, weakReason } = req.body;
    if (!topic) {
      sendError(res, 'Topic is required', 400);
      return;
    }

    const explanation = await knowledgeGraphService.explainWeakness(topic, mastery, weakReason);
    sendSuccess(res, { topic, explanation }, 'Weakness explanation generated successfully');
  } catch (error) {
    next(error);
  }
};
