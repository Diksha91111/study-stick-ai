import React, { useState, useEffect } from 'react';
import { academicService } from '../services/academicService';
import { Exam, Subject } from '../types';
import { ExamModal } from '../components/academic/ExamModal';
import { CountdownTimer } from '../components/common/CountdownTimer';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExamsData = async () => {
    try {
      const [examsData, subjectsData] = await Promise.all([
        academicService.getExams(),
        academicService.getSubjects(),
      ]);
      setExams(examsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await academicService.deleteExam(id);
      fetchExamsData();
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  const upcomingExams = exams.filter((e) => e.status === 'upcoming');
  const pastExams = exams.filter((e) => e.status === 'completed');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Exams, Mock Tests & Real-time Countdowns
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Never miss an exam date — track syllabus coverage, score targets, and countdowns for university and competitive tests
          </p>
        </div>

        <button
          onClick={() => {
            setEditingExam(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Schedule New Exam
        </button>
      </div>

      {/* Upcoming Exams Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          Upcoming Exams ({upcomingExams.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {upcomingExams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 mb-1.5">
                      {exam.examType.replace('_', ' ').toUpperCase()}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {exam.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {exam.subjectId
                        ? `${exam.subjectId.name} (${exam.subjectId.code})`
                        : exam.customSubjectName || 'Competitive Prep'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingExam(exam);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exam Specifics */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{exam.durationMinutes} Minutes</span>
                  </div>
                  {exam.venue && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate">{exam.venue}</span>
                    </div>
                  )}
                </div>

                {/* Syllabus coverage */}
                {exam.syllabusCoverage && (
                  <div className="mt-3 p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs">
                    <p className="font-semibold text-purple-900 dark:text-purple-300 text-[11px] mb-0.5">
                      Syllabus Topics Covered:
                    </p>
                    <p className="text-purple-700 dark:text-purple-400 text-[11px]">
                      {exam.syllabusCoverage}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target: {exam.targetScore} / {exam.totalMarks}
                  </span>
                </div>

                <div>
                  <CountdownTimer targetDate={exam.examDate} size="md" />
                </div>
              </div>
            </div>
          ))}

          {upcomingExams.length === 0 && (
            <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No upcoming exams scheduled. Click "+ Schedule New Exam" to set up your countdowns!
            </div>
          )}
        </div>
      </div>

      {/* Past / Completed Exams History */}
      {pastExams.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Completed Exams History ({pastExams.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastExams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 dark:text-white">{exam.title}</h5>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold">
                    Completed
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Exam Date: {new Date(exam.examDate).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center justify-between font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Score Achieved:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {exam.actualScore !== undefined ? exam.actualScore : 'Not logged'} /{' '}
                    {exam.totalMarks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <ExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExamsData}
        subjects={subjects}
        initialExam={editingExam}
      />
    </div>
  );
};
