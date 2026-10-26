"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const Subject_js_1 = require("../models/Subject.js");
const Task_js_1 = require("../models/Task.js");
const Exam_js_1 = require("../models/Exam.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const response_js_1 = require("../utils/response.js");
const conflictDetector_js_1 = require("../utils/conflictDetector.js");
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const now = new Date();
        // 1. Subjects Summary
        const subjects = await Subject_js_1.Subject.find({ userId });
        const totalSubjects = subjects.length;
        const avgSyllabusProgress = totalSubjects > 0
            ? Math.round(subjects.reduce((sum, s) => sum + (s.syllabusProgress || 0), 0) /
                totalSubjects)
            : 0;
        // 2. Tasks Summary
        const allTasks = await Task_js_1.Task.find({ userId }).populate('subjectId', 'name code color');
        const pendingTasks = allTasks.filter((t) => t.status !== 'completed');
        const urgentTasks = pendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
        const completedTasks = allTasks.filter((t) => t.status === 'completed');
        // 3. Upcoming Exams
        const upcomingExams = await Exam_js_1.Exam.find({
            userId,
            examDate: { $gte: now },
            status: 'upcoming',
        })
            .populate('subjectId', 'name code color')
            .sort({ examDate: 1 });
        const nearestExam = upcomingExams[0] || null;
        // 4. Today's Timetable Slots
        // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
        // In our DB: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
        const jsDay = now.getDay();
        const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;
        const todaySlots = await TimetableSlot_js_1.TimetableSlot.find({
            userId,
            dayOfWeek: todayDayOfWeek,
        })
            .populate('subjectId', 'name code color')
            .sort({ startTime: 1 });
        const collegeSlots = todaySlots.filter((s) => ['college_lecture', 'college_lab', 'college_tutorial'].includes(s.slotType));
        const studySlots = todaySlots.filter((s) => ['self_study', 'exam_prep'].includes(s.slotType));
        // 5. Sleep Schedule & Conflict Check
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId });
        let sleepConflicts = [];
        if (sleep && sleep.enableAlerts) {
            for (const slot of todaySlots) {
                const conflict = (0, conflictDetector_js_1.checkSleepConflict)(slot.startTime, slot.endTime, sleep.bedTime, sleep.wakeTime);
                if (conflict.hasConflict) {
                    sleepConflicts.push({
                        slotTitle: slot.title,
                        time: `${slot.startTime} - ${slot.endTime}`,
                        reason: conflict.reason,
                    });
                }
            }
        }
        // 6. Nearest Urgent Deadlines (mix of high/urgent tasks and exams in next 14 days)
        const upcomingDeadlines = [
            ...pendingTasks.map((t) => ({
                id: t._id,
                kind: 'task',
                type: t.taskType,
                title: t.title,
                subject: t.subjectId ? t.subjectId.name : 'Academic',
                subjectColor: t.subjectId ? t.subjectId.color : '#6366f1',
                priority: t.priority,
                deadline: t.dueDate,
            })),
            ...upcomingExams.map((e) => ({
                id: e._id,
                kind: 'exam',
                type: e.examType,
                title: e.title,
                subject: e.subjectId
                    ? e.subjectId.name
                    : e.customSubjectName || 'Exam',
                subjectColor: e.subjectId ? e.subjectId.color : '#ec4899',
                priority: 'urgent',
                deadline: e.examDate,
            })),
        ]
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 5);
        (0, response_js_1.sendSuccess)(res, {
            metrics: {
                totalSubjects,
                avgSyllabusProgress,
                pendingTasksCount: pendingTasks.length,
                urgentTasksCount: urgentTasks.length,
                completedTasksCount: completedTasks.length,
                upcomingExamsCount: upcomingExams.length,
                todayCollegeHours: collegeSlots.length,
                todayStudyHours: studySlots.length,
            },
            nearestExam,
            todaySlots,
            upcomingDeadlines,
            sleepSchedule: sleep,
            sleepConflicts,
        }, 'Dashboard stats retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
