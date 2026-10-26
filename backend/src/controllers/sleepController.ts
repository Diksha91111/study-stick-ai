import { Response, NextFunction } from 'express';
import { SleepSchedule } from '../models/SleepSchedule.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { checkSleepConflict } from '../utils/conflictDetector.js';

export const getSleepSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let sleep = await SleepSchedule.findOne({ userId: req.user?.userId });
    if (!sleep) {
      sleep = await SleepSchedule.create({
        userId: req.user?.userId,
        bedTime: '23:30',
        wakeTime: '07:00',
        targetSleepHours: 7.5,
        enableAlerts: true,
      });
    }

    sendSuccess(res, sleep, 'Sleep schedule retrieved');
  } catch (error) {
    next(error);
  }
};

export const updateSleepSchedule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { bedTime, wakeTime, targetSleepHours, windDownMinutes, enableAlerts } =
      req.body;

    const sleep = await SleepSchedule.findOneAndUpdate(
      { userId: req.user?.userId },
      {
        $set: {
          ...(bedTime && { bedTime }),
          ...(wakeTime && { wakeTime }),
          ...(targetSleepHours !== undefined && { targetSleepHours }),
          ...(windDownMinutes !== undefined && { windDownMinutes }),
          ...(enableAlerts !== undefined && { enableAlerts }),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    sendSuccess(res, sleep, 'Sleep schedule updated');
  } catch (error) {
    next(error);
  }
};

export const getSleepConflicts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sleep = await SleepSchedule.findOne({ userId: req.user?.userId });
    if (!sleep) {
      sendSuccess(res, { conflicts: [], safe: true });
      return;
    }

    const slots = await TimetableSlot.find({ userId: req.user?.userId }).populate(
      'subjectId',
      'name code'
    );

    const conflicts = [];
    for (const slot of slots) {
      const conflict = checkSleepConflict(
        slot.startTime,
        slot.endTime,
        sleep.bedTime,
        sleep.wakeTime
      );
      if (conflict.hasConflict) {
        conflicts.push({
          slotId: slot._id,
          title: slot.title,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotType: slot.slotType,
          reason: conflict.reason,
        });
      }
    }

    sendSuccess(
      res,
      {
        conflicts,
        safe: conflicts.length === 0,
        sleepSchedule: sleep,
      },
      'Sleep conflict audit retrieved'
    );
  } catch (error) {
    next(error);
  }
};
