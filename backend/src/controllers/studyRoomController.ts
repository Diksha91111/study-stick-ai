import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { studyRoomService } from '../services/studyRoomService.js';
import { studyRoomStreamService } from '../services/studyRoomStreamService.js';

export const createRoom = async (
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

    const { name, description, goal, privacy, maxMembers, defaultFocusDuration } = req.body;
    if (!name || !goal) {
      sendError(res, 'Room name and study goal are required', 400);
      return;
    }

    const room = await studyRoomService.createRoom(userId, {
      name,
      description,
      goal,
      privacy,
      maxMembers: maxMembers ? Number(maxMembers) : undefined,
      defaultFocusDuration: defaultFocusDuration ? Number(defaultFocusDuration) : undefined,
    });

    sendSuccess(res, room, 'Study room created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyRooms = async (
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

    const rooms = await studyRoomService.getUserRooms(userId);
    sendSuccess(res, rooms, 'User study rooms retrieved');
  } catch (error) {
    next(error);
  }
};

export const getPublicRooms = async (
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

    const rooms = await studyRoomService.getPublicRooms(userId);
    sendSuccess(res, rooms, 'Public study rooms retrieved');
  } catch (error) {
    next(error);
  }
};

export const getRoomDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const room = await studyRoomService.getRoomDetails(roomId, userId);
    sendSuccess(res, room, 'Study room details retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve room details', 403);
  }
};

export const joinRoomByInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { inviteCode } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!inviteCode || typeof inviteCode !== 'string') {
      sendError(res, 'A valid invite code is required to join a private room', 400);
      return;
    }

    const room = await studyRoomService.joinByInviteCode(userId, inviteCode);
    sendSuccess(res, room, 'Successfully joined study room');
  } catch (error: any) {
    sendError(res, error.message || 'Unable to join study room', 400);
  }
};

export const joinPublicRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const room = await studyRoomService.joinPublicRoom(userId, roomId);
    sendSuccess(res, room, 'Successfully joined public study room');
  } catch (error: any) {
    sendError(res, error.message || 'Unable to join study room', 400);
  }
};

export const leaveRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const result = await studyRoomService.leaveRoom(userId, roomId);
    sendSuccess(res, result, result.message);
  } catch (error: any) {
    sendError(res, error.message || 'Unable to leave study room', 400);
  }
};

export const updateRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const room = await studyRoomService.updateRoom(userId, roomId, req.body);
    sendSuccess(res, room, 'Room settings updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update room settings', 403);
  }
};

export const regenerateInvite = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const inviteCode = await studyRoomService.regenerateInviteCode(userId, roomId);
    sendSuccess(res, { inviteCode }, 'Invite code regenerated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to regenerate invite code', 403);
  }
};

export const manageMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId, targetUserId } = req.params;
    const { action } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const room = await studyRoomService.manageMember(
      userId,
      roomId,
      targetUserId,
      action
    );
    sendSuccess(res, room, `Member ${action.toLowerCase()} completed`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update member role', 403);
  }
};

/**
 * SSE Real-Time Event Stream
 */
export const connectRoomStream = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      res.status(401).end();
      return;
    }

    // Verify member has access
    await studyRoomService.getAuthorizedMember(roomId, userId);

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const cleanup = studyRoomStreamService.registerClient(roomId, userId, res);

    req.on('close', () => {
      cleanup();
    });
  } catch {
    res.status(403).end();
  }
};

/**
 * Focus Session Handlers
 */
export const startFocusSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { goal, durationMinutes } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!goal) {
      sendError(res, 'Session goal is required', 400);
      return;
    }

    const session = await studyRoomService.startFocusSession(userId, roomId, {
      goal,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
    });

    sendSuccess(res, session, 'Focus session started', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to start focus session', 403);
  }
};

export const updateFocusSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { action } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const result = await studyRoomService.updateFocusSession(userId, roomId, action);
    sendSuccess(res, result, `Focus session ${action.toLowerCase()}`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update focus session', 403);
  }
};

export const updateParticipantPresence = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const action = req.body.action || req.body.status;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    let status: 'STUDYING' | 'BREAK' | 'LEAVE' = 'STUDYING';
    if (action === 'BREAK') status = 'BREAK';
    else if (action === 'LEAVE') status = 'LEAVE';
    else if (action === 'JOIN' || action === 'RESUME' || action === 'STUDYING') status = 'STUDYING';

    const session = await studyRoomService.updateParticipantSessionStatus(
      userId,
      roomId,
      status
    );
    sendSuccess(res, session, 'Participant status updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update participant status', 400);
  }
};

export const updatePresence = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { presence } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!presence) {
      sendError(res, 'Presence status is required', 400);
      return;
    }

    const member = await studyRoomService.updateMemberPresence(userId, roomId, presence);
    sendSuccess(res, member, 'Presence status updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update presence', 400);
  }
};

export const getMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const { room } = await studyRoomService.getAuthorizedMember(roomId, userId);
    await room.populate('members.userId', 'name email avatar');
    sendSuccess(res, room.members, 'Room members retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve members', 403);
  }
};

/**
 * Chat Handlers
 */
export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const messages = await studyRoomService.getMessages(userId, roomId);
    sendSuccess(res, messages, 'Chat messages retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve messages', 403);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { content } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const message = await studyRoomService.sendMessage(userId, roomId, content);
    sendSuccess(res, message, 'Message sent', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to send message', 400);
  }
};

/**
 * Task Handlers
 */
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const tasks = await studyRoomService.getTasks(userId, roomId);
    sendSuccess(res, tasks, 'Room tasks retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve tasks', 403);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!title) {
      sendError(res, 'Task title is required', 400);
      return;
    }

    const task = await studyRoomService.createTask(userId, roomId, {
      title,
      description,
      dueDate,
    });
    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create task', 400);
  }
};

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId, taskId } = req.params;
    const { status } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const task = await studyRoomService.updateTaskStatus(
      userId,
      roomId,
      taskId,
      status
    );
    sendSuccess(res, task, 'Task status updated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update task status', 400);
  }
};

/**
 * Resource Handlers
 */
export const getResources = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const resources = await studyRoomService.getSharedResources(userId, roomId);
    sendSuccess(res, resources, 'Shared resources retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve resources', 403);
  }
};

export const shareResource = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { resourceId, note } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!resourceId) {
      sendError(res, 'Resource ID is required', 400);
      return;
    }

    const resource = await studyRoomService.shareResource(
      userId,
      roomId,
      resourceId,
      note
    );
    sendSuccess(res, resource, 'Resource shared successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to share resource', 400);
  }
};

/**
 * Quiz Handlers
 */
export const getActiveQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const quiz = await studyRoomService.getActiveQuiz(userId, roomId);
    sendSuccess(res, quiz, 'Active quiz session retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve active quiz', 403);
  }
};

export const startGroupQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { topic } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!topic) {
      sendError(res, 'Quiz topic is required', 400);
      return;
    }

    const quiz = await studyRoomService.startGroupQuiz(userId, roomId, topic);
    sendSuccess(res, quiz, 'Group quiz launched', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to start group quiz', 403);
  }
};

export const submitQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { quizId, answers } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!quizId || !answers || !Array.isArray(answers)) {
      sendError(res, 'Quiz ID and answers array are required', 400);
      return;
    }

    const result = await studyRoomService.submitQuizAnswers(
      userId,
      roomId,
      quizId,
      answers
    );
    sendSuccess(res, result, 'Quiz answers evaluated and saved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to submit quiz answers', 400);
  }
};

/**
 * AI Assistant Handler
 */
export const askAIInRoom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;
    const { action, prompt, topic, resourceId } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    if (!prompt) {
      sendError(res, 'Prompt is required', 400);
      return;
    }

    const answer = await studyRoomService.askAI(userId, roomId, {
      action: action || 'explain',
      prompt,
      topic,
      resourceId,
    });

    sendSuccess(res, { answer }, 'AI response generated');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to generate AI response', 400);
  }
};

/**
 * Room Progress Metrics
 */
export const getRoomProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { roomId } = req.params;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const progress = await studyRoomService.getRoomProgress(userId, roomId);
    sendSuccess(res, progress, 'Study room progress metrics retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to retrieve room progress', 403);
  }
};
