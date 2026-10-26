import { AIToolDefinition } from '../types/ai.types.js';
import { Subject } from '../../models/Subject.js';
import { Task } from '../../models/Task.js';
import { Exam } from '../../models/Exam.js';

export const getStudentAnalyticsTool: AIToolDefinition = {
  name: 'getStudentAnalytics',
  description: 'Calculates high-level academic mastery, task completion rate, and preparation status for the student.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (userId: string) => {
    const subjects = await Subject.find({ userId });
    const allTasks = await Task.find({ userId });
    const allExams = await Exam.find({ userId });

    const totalSubjects = subjects.length;
    const avgProgress =
      totalSubjects > 0
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

export const analyticsTools: AIToolDefinition[] = [getStudentAnalyticsTool];
