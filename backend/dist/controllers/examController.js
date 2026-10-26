"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExam = exports.updateExam = exports.createExam = exports.getExams = void 0;
const Exam_js_1 = require("../models/Exam.js");
const response_js_1 = require("../utils/response.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const getExams = async (req, res, next) => {
    try {
        const { status, examType } = req.query;
        const filter = { userId: req.user?.userId };
        if (status)
            filter.status = status;
        if (examType)
            filter.examType = examType;
        const exams = await Exam_js_1.Exam.find(filter)
            .populate('subjectId', 'name code color')
            .sort({ examDate: 1 });
        (0, response_js_1.sendSuccess)(res, exams, 'Exams retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getExams = getExams;
const createExam = async (req, res, next) => {
    try {
        const { subjectId, customSubjectName, title, examType, examDate, durationMinutes, venue, syllabusCoverage, targetScore, totalMarks, notes, } = req.body;
        if (!title || !examDate) {
            (0, response_js_1.sendError)(res, 'Exam title and exam date are required', 400);
            return;
        }
        const newExam = await Exam_js_1.Exam.create({
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
        const populatedExam = await Exam_js_1.Exam.findById(newExam._id).populate('subjectId', 'name code color');
        // Schedule exam reminder
        notificationService_js_1.notificationService.onExamCreatedOrUpdated(newExam).catch((err) => console.error('[Exam Event] Notification scheduling error:', err));
        (0, response_js_1.sendSuccess)(res, populatedExam, 'Exam scheduled successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createExam = createExam;
const updateExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (req.body.examDate) {
            req.body.examDate = new Date(req.body.examDate);
        }
        const exam = await Exam_js_1.Exam.findOneAndUpdate({ _id: id, userId: req.user?.userId }, { $set: req.body }, { new: true, runValidators: true }).populate('subjectId', 'name code color');
        if (!exam) {
            (0, response_js_1.sendError)(res, 'Exam not found', 404);
            return;
        }
        // Update scheduled exam reminder
        notificationService_js_1.notificationService.onExamCreatedOrUpdated(exam).catch((err) => console.error('[Exam Event] Notification update error:', err));
        (0, response_js_1.sendSuccess)(res, exam, 'Exam updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateExam = updateExam;
const deleteExam = async (req, res, next) => {
    try {
        const { id } = req.params;
        const exam = await Exam_js_1.Exam.findOneAndDelete({
            _id: id,
            userId: req.user?.userId,
        });
        if (!exam) {
            (0, response_js_1.sendError)(res, 'Exam not found', 404);
            return;
        }
        // Cancel pending reminders for deleted exam
        notificationService_js_1.notificationService.onExamDeleted(id).catch((err) => console.error('[Exam Event] Notification cancellation error:', err));
        (0, response_js_1.sendSuccess)(res, null, 'Exam deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExam = deleteExam;
