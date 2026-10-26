"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyTools = exports.getUpcomingExamsTool = exports.getEnrolledSubjectsTool = void 0;
const Subject_js_1 = require("../../models/Subject.js");
const Exam_js_1 = require("../../models/Exam.js");
exports.getEnrolledSubjectsTool = {
    name: 'getEnrolledSubjects',
    description: 'Retrieves all enrolled academic subjects and their syllabus completion status for the student.',
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async (userId) => {
        const subjects = await Subject_js_1.Subject.find({ userId }).select('name code credits syllabusProgress category');
        return {
            success: true,
            subjects: subjects.map((s) => ({
                id: s._id,
                name: s.name,
                code: s.code,
                credits: s.credits,
                progress: s.syllabusProgress,
                category: s.category,
            })),
        };
    },
};
exports.getUpcomingExamsTool = {
    name: 'getUpcomingExams',
    description: 'Retrieves upcoming college exams and competitive mock tests for the student.',
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async (userId) => {
        const exams = await Exam_js_1.Exam.find({
            userId,
            examDate: { $gte: new Date() },
            status: 'upcoming',
        }).sort({ examDate: 1 });
        return {
            success: true,
            exams: exams.map((e) => ({
                id: e._id,
                title: e.title,
                examDate: e.examDate,
                type: e.examType,
                targetScore: e.targetScore,
            })),
        };
    },
};
exports.studyTools = [exports.getEnrolledSubjectsTool, exports.getUpcomingExamsTool];
