import { Response, NextFunction } from 'express';
import { Task } from '../models/Task.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notificationService } from '../services/notifications/notificationService.js';

export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskType, priority, status, subjectId } = req.query;
    const filter: any = { userId: req.user?.userId };

    if (taskType) filter.taskType = taskType;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (subjectId) filter.subjectId = subjectId;

    const tasks = await Task.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ dueDate: 1 });

    sendSuccess(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      subjectId,
      title,
      description,
      taskType,
      priority,
      status,
      dueDate,
      estimatedHours,
      actualHours,
      weightagePercentage,
      milestones,
      isVivaPrepared,
      submissionNotes,
    } = req.body;

    if (!title || !dueDate) {
      sendError(res, 'Task title and due date are required', 400);
      return;
    }

    const newTask = await Task.create({
      userId: req.user?.userId,
      subjectId: subjectId || undefined,
      title,
      description: description || '',
      taskType: taskType || 'assignment',
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: new Date(dueDate),
      estimatedHours: estimatedHours || 2,
      actualHours: actualHours || 0,
      weightagePercentage: weightagePercentage || 0,
      milestones: milestones || [],
      isVivaPrepared: isVivaPrepared || false,
      submissionNotes: submissionNotes || '',
    });

    const populatedTask = await Task.findById(newTask._id).populate(
      'subjectId',
      'name code color'
    );

    // Schedule task deadline reminder
    notificationService.onTaskCreatedOrUpdated(newTask).catch((err) =>
      console.error('[Task Event] Notification scheduling error:', err)
    );

    sendSuccess(res, populatedTask, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.body.dueDate) {
      req.body.dueDate = new Date(req.body.dueDate);
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('subjectId', 'name code color');

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Update scheduled task deadline reminder
    notificationService.onTaskCreatedOrUpdated(task).catch((err) =>
      console.error('[Task Event] Notification update error:', err)
    );

    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user?.userId,
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    // Cancel pending reminders for deleted task
    notificationService.onTaskDeleted(id).catch((err) =>
      console.error('[Task Event] Notification cancellation error:', err)
    );

    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};
