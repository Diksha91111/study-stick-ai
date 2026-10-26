"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubject = exports.updateSubject = exports.createSubject = exports.getSubjects = void 0;
const Subject_js_1 = require("../models/Subject.js");
const response_js_1 = require("../utils/response.js");
const getSubjects = async (req, res, next) => {
    try {
        const subjects = await Subject_js_1.Subject.find({ userId: req.user?.userId }).sort({
            createdAt: -1,
        });
        (0, response_js_1.sendSuccess)(res, subjects, 'Subjects retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getSubjects = getSubjects;
const createSubject = async (req, res, next) => {
    try {
        const { name, code, color, credits, professor, syllabusProgress, category, totalHoursTarget, } = req.body;
        if (!name) {
            (0, response_js_1.sendError)(res, 'Subject name is required', 400);
            return;
        }
        const subject = await Subject_js_1.Subject.create({
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
        (0, response_js_1.sendSuccess)(res, subject, 'Subject created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createSubject = createSubject;
const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await Subject_js_1.Subject.findOneAndUpdate({ _id: id, userId: req.user?.userId }, { $set: req.body }, { new: true, runValidators: true });
        if (!subject) {
            (0, response_js_1.sendError)(res, 'Subject not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, subject, 'Subject updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateSubject = updateSubject;
const deleteSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const subject = await Subject_js_1.Subject.findOneAndDelete({
            _id: id,
            userId: req.user?.userId,
        });
        if (!subject) {
            (0, response_js_1.sendError)(res, 'Subject not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, null, 'Subject deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSubject = deleteSubject;
