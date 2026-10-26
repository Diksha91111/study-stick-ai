"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plannerTools = exports.getDailyTimetableTool = exports.getPendingTasksTool = void 0;
const Task_js_1 = require("../../models/Task.js");
const TimetableSlot_js_1 = require("../../models/TimetableSlot.js");
exports.getPendingTasksTool = {
    name: 'getPendingTasks',
    description: 'Retrieves all pending assignments, projects, and study tasks for the student.',
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async (userId) => {
        const tasks = await Task_js_1.Task.find({ userId, status: { $ne: 'completed' } }).sort({ dueDate: 1 });
        return {
            success: true,
            tasks: tasks.map((t) => ({
                id: t._id,
                title: t.title,
                taskType: t.taskType,
                priority: t.priority,
                dueDate: t.dueDate,
                estimatedHours: t.estimatedHours,
            })),
        };
    },
};
exports.getDailyTimetableTool = {
    name: 'getDailyTimetable',
    description: 'Retrieves scheduled lectures and study slots for a specific day of the week (1=Monday...7=Sunday).',
    parameters: {
        type: 'object',
        properties: {
            dayOfWeek: { type: 'number', description: 'Day of week number from 1 to 7' },
        },
    },
    execute: async (userId, params) => {
        const jsDay = new Date().getDay();
        const day = params.dayOfWeek || (jsDay === 0 ? 7 : jsDay);
        const slots = await TimetableSlot_js_1.TimetableSlot.find({ userId, dayOfWeek: day }).sort({ startTime: 1 });
        return {
            success: true,
            dayOfWeek: day,
            slots: slots.map((s) => ({
                id: s._id,
                title: s.title,
                slotType: s.slotType,
                startTime: s.startTime,
                endTime: s.endTime,
            })),
        };
    },
};
exports.plannerTools = [exports.getPendingTasksTool, exports.getDailyTimetableTool];
