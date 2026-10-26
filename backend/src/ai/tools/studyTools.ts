import { AIToolDefinition } from '../types/ai.types.js';
import { Subject } from '../../models/Subject.js';
import { Exam } from '../../models/Exam.js';

export const getEnrolledSubjectsTool: AIToolDefinition = {
  name: 'getEnrolledSubjects',
  description: 'Retrieves all enrolled academic subjects and their syllabus completion status for the student.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (userId: string) => {
    const subjects = await Subject.find({ userId }).select('name code credits syllabusProgress category');
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

export const getUpcomingExamsTool: AIToolDefinition = {
  name: 'getUpcomingExams',
  description: 'Retrieves upcoming college exams and competitive mock tests for the student.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (userId: string) => {
    const exams = await Exam.find({
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

export const studyTools: AIToolDefinition[] = [getEnrolledSubjectsTool, getUpcomingExamsTool];
