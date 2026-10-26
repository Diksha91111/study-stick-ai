import { AIToolDefinition } from '../types/ai.types.js';
import { Task } from '../../models/Task.js';
import { TimetableSlot } from '../../models/TimetableSlot.js';

export const getPendingTasksTool: AIToolDefinition = {
  name: 'getPendingTasks',
  description: 'Retrieves all pending assignments, projects, and study tasks for the student.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (userId: string) => {
    const tasks = await Task.find({ userId, status: { $ne: 'completed' } }).sort({ dueDate: 1 });
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

export const getDailyTimetableTool: AIToolDefinition = {
  name: 'getDailyTimetable',
  description: 'Retrieves scheduled lectures and study slots for a specific day of the week (1=Monday...7=Sunday).',
  parameters: {
    type: 'object',
    properties: {
      dayOfWeek: { type: 'number', description: 'Day of week number from 1 to 7' },
    },
  },
  execute: async (userId: string, params: { dayOfWeek?: number }) => {
    const jsDay = new Date().getDay();
    const day = params.dayOfWeek || (jsDay === 0 ? 7 : jsDay);
    const slots = await TimetableSlot.find({ userId, dayOfWeek: day }).sort({ startTime: 1 });

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

export const plannerTools: AIToolDefinition[] = [getPendingTasksTool, getDailyTimetableTool];
