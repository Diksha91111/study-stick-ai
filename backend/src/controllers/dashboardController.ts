import { Response, NextFunction } from 'express';
import { Subject } from '../models/Subject.js';
import { Task } from '../models/Task.js';
import { Exam } from '../models/Exam.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { SleepSchedule } from '../models/SleepSchedule.js';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess } from '../utils/response.js';
import { checkSleepConflict } from '../utils/conflictDetector.js';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const now = new Date();

    // 1. Subjects Summary
    const subjects = await Subject.find({ userId });
    const totalSubjects = subjects.length;
    const avgSyllabusProgress =
      totalSubjects > 0
        ? Math.round(
            subjects.reduce((sum, s) => sum + (s.syllabusProgress || 0), 0) /
              totalSubjects
          )
        : 0;

    // 2. Tasks Summary
    const allTasks = await Task.find({ userId }).populate(
      'subjectId',
      'name code color'
    );
    const pendingTasks = allTasks.filter((t) => t.status !== 'completed');
    const urgentTasks = pendingTasks.filter(
      (t) => t.priority === 'urgent' || t.priority === 'high'
    );
    const completedTasks = allTasks.filter((t) => t.status === 'completed');

    // 3. Upcoming Exams
    const upcomingExams = await Exam.find({
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

    const todaySlots = await TimetableSlot.find({
      userId,
      dayOfWeek: todayDayOfWeek,
    })
      .populate('subjectId', 'name code color')
      .sort({ startTime: 1 });

    const collegeSlots = todaySlots.filter((s) =>
      ['college_lecture', 'college_lab', 'college_tutorial'].includes(s.slotType)
    );
    const studySlots = todaySlots.filter((s) =>
      ['self_study', 'exam_prep'].includes(s.slotType)
    );

    // 5. Sleep Schedule & Conflict Check
    const sleep = await SleepSchedule.findOne({ userId });
    let sleepConflicts = [];
    if (sleep && sleep.enableAlerts) {
      for (const slot of todaySlots) {
        const conflict = checkSleepConflict(
          slot.startTime,
          slot.endTime,
          sleep.bedTime,
          sleep.wakeTime
        );
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
        kind: 'task' as const,
        type: t.taskType,
        title: t.title,
        subject: t.subjectId ? (t.subjectId as any).name : 'Academic',
        subjectColor: t.subjectId ? (t.subjectId as any).color : '#6366f1',
        priority: t.priority,
        deadline: t.dueDate,
      })),
      ...upcomingExams.map((e) => ({
        id: e._id,
        kind: 'exam' as const,
        type: e.examType,
        title: e.title,
        subject: e.subjectId
          ? (e.subjectId as any).name
          : e.customSubjectName || 'Exam',
        subjectColor: e.subjectId ? (e.subjectId as any).color : '#ec4899',
        priority: 'urgent',
        deadline: e.examDate,
      })),
    ]
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    sendSuccess(
      res,
      {
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
      },
      'Dashboard stats retrieved'
    );
  } catch (error) {
    next(error);
  }
};
