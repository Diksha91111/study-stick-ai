import { AIToolDefinition } from '../types/ai.types.js';
import { studentMemory } from '../memory/studentMemory.js';

export const getStudentProfileTool: AIToolDefinition = {
  name: 'getStudentProfile',
  description: 'Retrieves the academic profile and current target exams of the authenticated student.',
  parameters: {
    type: 'object',
    properties: {},
  },
  execute: async (userId: string) => {
    const context = await studentMemory.getStudentContext(userId);
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

export const studentTools: AIToolDefinition[] = [getStudentProfileTool];
