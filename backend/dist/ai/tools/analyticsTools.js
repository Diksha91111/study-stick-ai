"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsTools = exports.getStudentAnalyticsTool = void 0;
const Subject_js_1 = require("../../models/Subject.js");
const Task_js_1 = require("../../models/Task.js");
const Exam_js_1 = require("../../models/Exam.js");
exports.getStudentAnalyticsTool = {
    name: 'getStudentAnalytics',
    description: 'Calculates high-level academic mastery, task completion rate, and preparation status for the student.',
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async (userId) => {
        const subjects = await Subject_js_1.Subject.find({ userId });
        const allTasks = await Task_js_1.Task.find({ userId });
        const allExams = await Exam_js_1.Exam.find({ userId });
        const totalSubjects = subjects.length;
        const avgProgress = totalSubjects > 0
            ? Math.round(subjects.reduce((acc, s) => acc + (s.syllabusProgress || 0), 0) / totalSubjects)
            : 0;
        const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
        const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
        return {
            success: true,
            analytics: {
                totalSubjects,
                avgSyllabusProgress: avgProgress,
                totalTasks: allTasks.length,
                completedTasks,
                taskCompletionRatePercentage: taskCompletionRate,
                upcomingExamsCount: allExams.filter((e) => e.status === 'upcoming').length,
            },
        };
    },
};
exports.analyticsTools = [exports.getStudentAnalyticsTool];
