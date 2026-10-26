import { User } from '../../models/User.js';
import { Profile } from '../../models/Profile.js';
import { Subject } from '../../models/Subject.js';
import { Task } from '../../models/Task.js';
import { Exam } from '../../models/Exam.js';
import { StudentContext } from '../types/ai.types.js';

export class StudentMemoryManager {
  async getStudentContext(userId: string): Promise<StudentContext | null> {
    if (!userId) return null;

    try {
      const user = await User.findById(userId).select('name email');
      if (!user) return null;

      const profile = await Profile.findOne({ userId });
      const subjects = await Subject.find({ userId }).select('name code syllabusProgress');
      const pendingTasks = await Task.find({ userId, status: { $ne: 'completed' } })
        .select('title priority dueDate')
        .sort({ dueDate: 1 })
        .limit(5);

      const upcomingExams = await Exam.find({
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
    } catch {
      // Safe fallback - do not leak DB errors to AI context
      return {
        studentId: userId,
      };
    }
  }
}

export const studentMemory = new StudentMemoryManager();
