import { Response, NextFunction } from 'express';
import { Subject } from '../models/Subject.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const subjects = await Subject.find({ userId: req.user?.userId }).sort({
      createdAt: -1,
    });
    sendSuccess(res, subjects, 'Subjects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      code,
      color,
      credits,
      professor,
      syllabusProgress,
      category,
      totalHoursTarget,
    } = req.body;

    if (!name) {
      sendError(res, 'Subject name is required', 400);
      return;
    }

    const subject = await Subject.create({
      userId: req.user?.userId,
      name,
      code: code || '',
      color: color || '#6366f1',
      credits: credits !== undefined ? credits : 4,
      professor: professor || '',
      syllabusProgress: syllabusProgress || 0,
      category: category || 'college_core',
      totalHoursTarget: totalHoursTarget || 40,
    });

    sendSuccess(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const subject = await Subject.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!subject) {
      sendError(res, 'Subject not found', 404);
      return;
    }

    sendSuccess(res, subject, 'Subject updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const subject = await Subject.findOneAndDelete({
      _id: id,
      userId: req.user?.userId,
    });

    if (!subject) {
      sendError(res, 'Subject not found', 404);
      return;
    }

    sendSuccess(res, null, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};
