"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.createTask = exports.getTasks = void 0;
const Task_js_1 = require("../models/Task.js");
const response_js_1 = require("../utils/response.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const getTasks = async (req, res, next) => {
    try {
        const { taskType, priority, status, subjectId } = req.query;
        const filter = { userId: req.user?.userId };
        if (taskType)
            filter.taskType = taskType;
        if (priority)
            filter.priority = priority;
        if (status)
            filter.status = status;
        if (subjectId)
            filter.subjectId = subjectId;
        const tasks = await Task_js_1.Task.find(filter)
            .populate('subjectId', 'name code color')
            .sort({ dueDate: 1 });
        (0, response_js_1.sendSuccess)(res, tasks, 'Tasks retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res, next) => {
    try {
        const { subjectId, title, description, taskType, priority, status, dueDate, estimatedHours, actualHours, weightagePercentage, milestones, isVivaPrepared, submissionNotes, } = req.body;
        if (!title || !dueDate) {
            (0, response_js_1.sendError)(res, 'Task title and due date are required', 400);
            return;
        }
        const newTask = await Task_js_1.Task.create({
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
        const populatedTask = await Task_js_1.Task.findById(newTask._id).populate('subjectId', 'name code color');
        // Schedule task deadline reminder
        notificationService_js_1.notificationService.onTaskCreatedOrUpdated(newTask).catch((err) => console.error('[Task Event] Notification scheduling error:', err));
        (0, response_js_1.sendSuccess)(res, populatedTask, 'Task created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
const updateTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.body.dueDate) {
            req.body.dueDate = new Date(req.body.dueDate);
        }
        const task = await Task_js_1.Task.findOneAndUpdate({ _id: id, userId: req.user?.userId }, { $set: req.body }, { new: true, runValidators: true }).populate('subjectId', 'name code color');
        if (!task) {
            (0, response_js_1.sendError)(res, 'Task not found', 404);
            return;
        }
        // Update scheduled task deadline reminder
        notificationService_js_1.notificationService.onTaskCreatedOrUpdated(task).catch((err) => console.error('[Task Event] Notification update error:', err));
        (0, response_js_1.sendSuccess)(res, task, 'Task updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const task = await Task_js_1.Task.findOneAndDelete({
            _id: id,
            userId: req.user?.userId,
        });
        if (!task) {
            (0, response_js_1.sendError)(res, 'Task not found', 404);
            return;
        }
        // Cancel pending reminders for deleted task
        notificationService_js_1.notificationService.onTaskDeleted(id).catch((err) => console.error('[Task Event] Notification cancellation error:', err));
        (0, response_js_1.sendSuccess)(res, null, 'Task deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTask = deleteTask;
