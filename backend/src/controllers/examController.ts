import { Response, NextFunction } from 'express';
import { Exam } from '../models/Exam.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notificationService } from '../services/notifications/notificationService.js';

export const getExams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, examType } = req.query;
    const filter: any = { userId: req.user?.userId };

    if (status) filter.status = status;
    if (examType) filter.examType = examType;

    const exams = await Exam.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ examDate: 1 });

    sendSuccess(res, exams, 'Exams retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createExam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      subjectId,
      customSubjectName,
      title,
      examType,
      examDate,
      durationMinutes,
      venue,
      syllabusCoverage,
      targetScore,
      totalMarks,
      notes,
    } = req.body;

    if (!title || !examDate) {
      sendError(res, 'Exam title and exam date are required', 400);
      return;
    }

    const newExam = await Exam.create({
      userId: req.user?.userId,
      subjectId: subjectId || undefined,
      customSubjectName: customSubjectName || '',
      title,
      examType: examType || 'college_midterm',
      examDate: new Date(examDate),
      durationMinutes: durationMinutes || 180,
      venue: venue || '',
      syllabusCoverage: syllabusCoverage || '',
      targetScore: targetScore || 85,
      totalMarks: totalMarks || 100,
      notes: notes || '',
    });

    const populatedExam = await Exam.findById(newExam._id).populate(
      'subjectId',
      'name code color'
    );

    // Schedule exam reminder
    notificationService.onExamCreatedOrUpdated(newExam).catch((err) =>
      console.error('[Exam Event] Notification scheduling error:', err)
    );

    sendSuccess(res, populatedExam, 'Exam scheduled successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.body.examDate) {
      req.body.examDate = new Date(req.body.examDate);
    }

    const exam = await Exam.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('subjectId', 'name code color');

    if (!exam) {
      sendError(res, 'Exam not found', 404);
      return;
    }

    // Update scheduled exam reminder
    notificationService.onExamCreatedOrUpdated(exam).catch((err) =>
      console.error('[Exam Event] Notification update error:', err)
    );

    sendSuccess(res, exam, 'Exam updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const exam = await Exam.findOneAndDelete({
      _id: id,
      userId: req.user?.userId,
    });

    if (!exam) {
      sendError(res, 'Exam not found', 404);
      return;
    }

    // Cancel pending reminders for deleted exam
    notificationService.onExamDeleted(id).catch((err) =>
      console.error('[Exam Event] Notification cancellation error:', err)
    );

    sendSuccess(res, null, 'Exam deleted successfully');
  } catch (error) {
    next(error);
  }
};
