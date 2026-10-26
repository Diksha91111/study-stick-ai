"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSlot = exports.updateSlot = exports.createSlot = exports.getSlots = void 0;
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const response_js_1 = require("../utils/response.js");
const conflictDetector_js_1 = require("../utils/conflictDetector.js");
const getSlots = async (req, res, next) => {
    try {
        const { dayOfWeek } = req.query;
        const filter = { userId: req.user?.userId };
        if (dayOfWeek) {
            filter.dayOfWeek = Number(dayOfWeek);
        }
        const slots = await TimetableSlot_js_1.TimetableSlot.find(filter)
            .populate('subjectId', 'name code color')
            .sort({ dayOfWeek: 1, startTime: 1 });
        (0, response_js_1.sendSuccess)(res, slots, 'Timetable slots retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getSlots = getSlots;
const createSlot = async (req, res, next) => {
    try {
        const { dayOfWeek, startTime, endTime, slotType, subjectId, title, room, notes, color } = req.body;
        if (!dayOfWeek || !startTime || !endTime || !title) {
            (0, response_js_1.sendError)(res, 'Day of week, start time, end time, and title are required', 400);
            return;
        }
        const startMins = (0, conflictDetector_js_1.timeToMinutes)(startTime);
        const endMins = (0, conflictDetector_js_1.timeToMinutes)(endTime);
        if (startMins >= endMins) {
            (0, response_js_1.sendError)(res, 'Start time must be before end time', 400);
            return;
        }
        // Check conflict with existing slots on the same day
        const existingSlots = await TimetableSlot_js_1.TimetableSlot.find({
            userId: req.user?.userId,
            dayOfWeek: Number(dayOfWeek),
        });
        let timetableConflict = null;
        for (const slot of existingSlots) {
            const exStart = (0, conflictDetector_js_1.timeToMinutes)(slot.startTime);
            const exEnd = (0, conflictDetector_js_1.timeToMinutes)(slot.endTime);
            if ((0, conflictDetector_js_1.doRangesOverlap)(startMins, endMins, exStart, exEnd)) {
                timetableConflict = `Slot overlaps with existing slot "${slot.title}" (${slot.startTime} - ${slot.endTime})`;
                break;
            }
        }
        // Check conflict with Sleep Schedule
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId: req.user?.userId });
        let sleepWarning = null;
        if (sleep && sleep.enableAlerts) {
            const conflictCheck = (0, conflictDetector_js_1.checkSleepConflict)(startTime, endTime, sleep.bedTime, sleep.wakeTime);
            if (conflictCheck.hasConflict) {
                sleepWarning = conflictCheck.reason;
            }
        }
        const newSlot = await TimetableSlot_js_1.TimetableSlot.create({
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
        const populatedSlot = await TimetableSlot_js_1.TimetableSlot.findById(newSlot._id).populate('subjectId', 'name code color');
        (0, response_js_1.sendSuccess)(res, {
            slot: populatedSlot,
            warning: sleepWarning || timetableConflict || null,
            hasSleepConflict: !!sleepWarning,
            hasTimetableConflict: !!timetableConflict,
        }, 'Timetable slot created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createSlot = createSlot;
const updateSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;
        if (startTime && endTime) {
            if ((0, conflictDetector_js_1.timeToMinutes)(startTime) >= (0, conflictDetector_js_1.timeToMinutes)(endTime)) {
                (0, response_js_1.sendError)(res, 'Start time must be before end time', 400);
                return;
            }
        }
        const slot = await TimetableSlot_js_1.TimetableSlot.findOneAndUpdate({ _id: id, userId: req.user?.userId }, { $set: req.body }, { new: true, runValidators: true }).populate('subjectId', 'name code color');
        if (!slot) {
            (0, response_js_1.sendError)(res, 'Slot not found', 404);
            return;
        }
        // Check sleep conflict
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId: req.user?.userId });
        let sleepWarning = null;
        if (sleep && sleep.enableAlerts) {
            const conflict = (0, conflictDetector_js_1.checkSleepConflict)(slot.startTime, slot.endTime, sleep.bedTime, sleep.wakeTime);
            if (conflict.hasConflict) {
                sleepWarning = conflict.reason;
            }
        }
        (0, response_js_1.sendSuccess)(res, {
            slot,
            warning: sleepWarning,
        }, 'Slot updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateSlot = updateSlot;
const deleteSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const slot = await TimetableSlot_js_1.TimetableSlot.findOneAndDelete({
            _id: id,
            userId: req.user?.userId,
        });
        if (!slot) {
            (0, response_js_1.sendError)(res, 'Slot not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, null, 'Slot deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSlot = deleteSlot;
