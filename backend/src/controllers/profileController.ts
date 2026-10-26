import { Response, NextFunction } from 'express';
import { Profile } from '../models/Profile.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await Profile.findOne({ userId: req.user?.userId });
    if (!profile) {
      sendError(res, 'Profile not found', 404);
      return;
    }
    sendSuccess(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      collegeName,
      degree,
      branch,
      currentSemester,
      currentYear,
      targetCompetitiveExams,
      targetDailyStudyHours,
      chronotype,
      pomodoroWorkMins,
      pomodoroBreakMins,
    } = req.body;

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user?.userId },
      {
        $set: {
          ...(collegeName !== undefined && { collegeName }),
          ...(degree !== undefined && { degree }),
          ...(branch !== undefined && { branch }),
          ...(currentSemester !== undefined && { currentSemester }),
          ...(currentYear !== undefined && { currentYear }),
          ...(targetCompetitiveExams !== undefined && { targetCompetitiveExams }),
          ...(targetDailyStudyHours !== undefined && { targetDailyStudyHours }),
          ...(chronotype !== undefined && { chronotype }),
          ...(pomodoroWorkMins !== undefined && { pomodoroWorkMins }),
          ...(pomodoroBreakMins !== undefined && { pomodoroBreakMins }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    sendSuccess(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
