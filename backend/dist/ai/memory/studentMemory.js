"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentMemory = exports.StudentMemoryManager = void 0;
const User_js_1 = require("../../models/User.js");
const Profile_js_1 = require("../../models/Profile.js");
const Subject_js_1 = require("../../models/Subject.js");
const Task_js_1 = require("../../models/Task.js");
const Exam_js_1 = require("../../models/Exam.js");
class StudentMemoryManager {
    async getStudentContext(userId) {
        if (!userId)
            return null;
        try {
            const user = await User_js_1.User.findById(userId).select('name email');
            if (!user)
                return null;
            const profile = await Profile_js_1.Profile.findOne({ userId });
            const subjects = await Subject_js_1.Subject.find({ userId }).select('name code syllabusProgress');
            const pendingTasks = await Task_js_1.Task.find({ userId, status: { $ne: 'completed' } })
                .select('title priority dueDate')
                .sort({ dueDate: 1 })
                .limit(5);
            const upcomingExams = await Exam_js_1.Exam.find({
                userId,
                examDate: { $gte: new Date() },
                status: 'upcoming',
            })
                .select('title examDate customSubjectName')
                .sort({ examDate: 1 })
                .limit(5);
            return {
                studentId: userId,
                name: user.name,
                email: user.email,
                collegeName: profile?.collegeName,
                degree: profile?.degree,
                branch: profile?.branch,
                currentSemester: profile?.currentSemester,
                targetCompetitiveExams: profile?.targetCompetitiveExams?.map((e) => ({
                    examName: e.examName,
                    targetYear: e.targetYear,
                })),
                enrolledSubjects: subjects.map((s) => ({
                    name: s.name,
                    code: s.code,
                    progress: s.syllabusProgress || 0,
                })),
                pendingTasks: pendingTasks.map((t) => ({
                    title: t.title,
                    priority: t.priority,
                    dueDate: t.dueDate,
                })),
                upcomingExams: upcomingExams.map((e) => ({
                    title: e.title,
                    examDate: e.examDate,
                })),
            };
        }
        catch {
            // Safe fallback - do not leak DB errors to AI context
            return {
                studentId: userId,
            };
        }
    }
}
exports.StudentMemoryManager = StudentMemoryManager;
exports.studentMemory = new StudentMemoryManager();
