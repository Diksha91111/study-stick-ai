"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentTools = exports.getStudentProfileTool = void 0;
const studentMemory_js_1 = require("../memory/studentMemory.js");
exports.getStudentProfileTool = {
    name: 'getStudentProfile',
    description: 'Retrieves the academic profile and current target exams of the authenticated student.',
    parameters: {
        type: 'object',
        properties: {},
    },
    execute: async (userId) => {
        const context = await studentMemory_js_1.studentMemory.getStudentContext(userId);
        if (!context) {
            return { success: false, error: 'Student profile not found.' };
        }
        return {
            success: true,
            profile: {
                name: context.name,
                college: context.collegeName,
                degree: context.degree,
                branch: context.branch,
                semester: context.currentSemester,
                targetExams: context.targetCompetitiveExams,
            },
        };
    },
};
exports.studentTools = [exports.getStudentProfileTool];
