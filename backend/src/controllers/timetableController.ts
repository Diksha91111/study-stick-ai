import { Response, NextFunction } from 'express';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { SleepSchedule } from '../models/SleepSchedule.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  checkSleepConflict,
  doRangesOverlap,
  timeToMinutes,
} from '../utils/conflictDetector.js';

export const getSlots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dayOfWeek } = req.query;
    const filter: any = { userId: req.user?.userId };

    if (dayOfWeek) {
      filter.dayOfWeek = Number(dayOfWeek);
    }

    const slots = await TimetableSlot.find(filter)
      .populate('subjectId', 'name code color')
      .sort({ dayOfWeek: 1, startTime: 1 });

    sendSuccess(res, slots, 'Timetable slots retrieved');
  } catch (error) {
    next(error);
  }
};

export const createSlot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { dayOfWeek, startTime, endTime, slotType, subjectId, title, room, notes, color } =
      req.body;

    if (!dayOfWeek || !startTime || !endTime || !title) {
      sendError(res, 'Day of week, start time, end time, and title are required', 400);
      return;
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (startMins >= endMins) {
      sendError(res, 'Start time must be before end time', 400);
      return;
    }

    // Check conflict with existing slots on the same day
    const existingSlots = await TimetableSlot.find({
      userId: req.user?.userId,
      dayOfWeek: Number(dayOfWeek),
    });

    let timetableConflict = null;
    for (const slot of existingSlots) {
      const exStart = timeToMinutes(slot.startTime);
      const exEnd = timeToMinutes(slot.endTime);
      if (doRangesOverlap(startMins, endMins, exStart, exEnd)) {
        timetableConflict = `Slot overlaps with existing slot "${slot.title}" (${slot.startTime} - ${slot.endTime})`;
        break;
      }
    }

    // Check conflict with Sleep Schedule
    const sleep = await SleepSchedule.findOne({ userId: req.user?.userId });
    let sleepWarning = null;
    if (sleep && sleep.enableAlerts) {
      const conflictCheck = checkSleepConflict(
        startTime,
        endTime,
        sleep.bedTime,
        sleep.wakeTime
      );
      if (conflictCheck.hasConflict) {
        sleepWarning = conflictCheck.reason;
      }
    }

    const newSlot = await TimetableSlot.create({
      userId: req.user?.userId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      slotType: slotType || 'college_lecture',
      subjectId: subjectId || undefined,
      title,
      room: room || '',
      notes: notes || '',
      color: color || '#6366f1',
    });

    const populatedSlot = await TimetableSlot.findById(newSlot._id).populate(
      'subjectId',
      'name code color'
    );

    sendSuccess(
      res,
      {
        slot: populatedSlot,
        warning: sleepWarning || timetableConflict || null,
        hasSleepConflict: !!sleepWarning,
        hasTimetableConflict: !!timetableConflict,
      },
      'Timetable slot created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateSlot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;

    if (startTime && endTime) {
      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        sendError(res, 'Start time must be before end time', 400);
        return;
      }
    }

    const slot = await TimetableSlot.findOneAndUpdate(
      { _id: id, userId: req.user?.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('subjectId', 'name code color');

    if (!slot) {
      sendError(res, 'Slot not found', 404);
      return;
    }

    // Check sleep conflict
    const sleep = await SleepSchedule.findOne({ userId: req.user?.userId });
    let sleepWarning = null;
    if (sleep && sleep.enableAlerts) {
      const conflict = checkSleepConflict(
        slot.startTime,
        slot.endTime,
        sleep.bedTime,
        sleep.wakeTime
      );
      if (conflict.hasConflict) {
        sleepWarning = conflict.reason;
      }
    }

    sendSuccess(
      res,
      {
        slot,
        warning: sleepWarning,
      },
      'Slot updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const deleteSlot = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const slot = await TimetableSlot.findOneAndDelete({
      _id: id,
      userId: req.user?.userId,
    });

    if (!slot) {
      sendError(res, 'Slot not found', 404);
      return;
    }

    sendSuccess(res, null, 'Slot deleted successfully');
  } catch (error) {
    next(error);
  }
};
