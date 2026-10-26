"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSleepConflicts = exports.updateSleepSchedule = exports.getSleepSchedule = void 0;
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const response_js_1 = require("../utils/response.js");
const conflictDetector_js_1 = require("../utils/conflictDetector.js");
const getSleepSchedule = async (req, res, next) => {
    try {
        let sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId: req.user?.userId });
        if (!sleep) {
            sleep = await SleepSchedule_js_1.SleepSchedule.create({
                userId: req.user?.userId,
                bedTime: '23:30',
                wakeTime: '07:00',
                targetSleepHours: 7.5,
                enableAlerts: true,
            });
        }
        (0, response_js_1.sendSuccess)(res, sleep, 'Sleep schedule retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getSleepSchedule = getSleepSchedule;
const updateSleepSchedule = async (req, res, next) => {
    try {
        const { bedTime, wakeTime, targetSleepHours, windDownMinutes, enableAlerts } = req.body;
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOneAndUpdate({ userId: req.user?.userId }, {
            $set: {
                ...(bedTime && { bedTime }),
                ...(wakeTime && { wakeTime }),
                ...(targetSleepHours !== undefined && { targetSleepHours }),
                ...(windDownMinutes !== undefined && { windDownMinutes }),
                ...(enableAlerts !== undefined && { enableAlerts }),
            },
        }, { new: true, upsert: true, runValidators: true });
        (0, response_js_1.sendSuccess)(res, sleep, 'Sleep schedule updated');
    }
    catch (error) {
        next(error);
    }
};
exports.updateSleepSchedule = updateSleepSchedule;
const getSleepConflicts = async (req, res, next) => {
    try {
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId: req.user?.userId });
        if (!sleep) {
            (0, response_js_1.sendSuccess)(res, { conflicts: [], safe: true });
            return;
        }
        const slots = await TimetableSlot_js_1.TimetableSlot.find({ userId: req.user?.userId }).populate('subjectId', 'name code');
        const conflicts = [];
        for (const slot of slots) {
            const conflict = (0, conflictDetector_js_1.checkSleepConflict)(slot.startTime, slot.endTime, sleep.bedTime, sleep.wakeTime);
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
        (0, response_js_1.sendSuccess)(res, {
            conflicts,
            safe: conflicts.length === 0,
            sleepSchedule: sleep,
        }, 'Sleep conflict audit retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getSleepConflicts = getSleepConflicts;
