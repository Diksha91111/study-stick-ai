import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Exam, Subject, ExamType, ExamStatus } from '../../types';
import { academicService } from '../../services/academicService';

interface ExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects: Subject[];
  initialExam?: Exam | null;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subjects,
  initialExam,
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [examType, setExamType] = useState<ExamType>('college_midterm');
  const [examDate, setExamDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [venue, setVenue] = useState('');
  const [syllabusCoverage, setSyllabusCoverage] = useState('');
  const [targetScore, setTargetScore] = useState(85);
  const [totalMarks, setTotalMarks] = useState(100);
  const [actualScore, setActualScore] = useState<number | ''>('');
  const [status, setStatus] = useState<ExamStatus>('upcoming');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialExam) {
      setTitle(initialExam.title);
      setSubjectId(initialExam.subjectId?._id || '');
      setCustomSubjectName(initialExam.customSubjectName || '');
      setExamType(initialExam.examType);
      setExamDate(
        initialExam.examDate
          ? new Date(initialExam.examDate).toISOString().slice(0, 16)
          : ''
      );
      setDurationMinutes(initialExam.durationMinutes || 120);
      setVenue(initialExam.venue || '');
      setSyllabusCoverage(initialExam.syllabusCoverage || '');
      setTargetScore(initialExam.targetScore || 85);
      setTotalMarks(initialExam.totalMarks || 100);
      setActualScore(
        initialExam.actualScore !== undefined ? initialExam.actualScore : ''
      );
      setStatus(initialExam.status || 'upcoming');
      setNotes(initialExam.notes || '');
    } else {
      setTitle('');
      setSubjectId(subjects[0]?._id || '');
      setCustomSubjectName('');
      setExamType('college_midterm');
      const d = new Date();
      d.setDate(d.getDate() + 10);
      d.setHours(10, 0, 0, 0);
      setExamDate(d.toISOString().slice(0, 16));
      setDurationMinutes(120);
      setVenue('Exam Hall 1');
      setSyllabusCoverage('Units 1, 2, 3');
      setTargetScore(85);
      setTotalMarks(100);
      setActualScore('');
      setStatus('upcoming');
      setNotes('');
    }
    setError(null);
  }, [initialExam, isOpen, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !examDate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title,
        subjectId: subjectId || undefined,
        customSubjectName: !subjectId ? customSubjectName : '',
        examType,
        examDate: new Date(examDate).toISOString(),
        durationMinutes: Number(durationMinutes),
        venue,
        syllabusCoverage,
        targetScore: Number(targetScore),
        totalMarks: Number(totalMarks),
        status,
        notes,
      };

      if (actualScore !== '') {
        payload.actualScore = Number(actualScore);
      }

      if (initialExam) {
        await academicService.updateExam(initialExam._id, payload);
      } else {
        await academicService.createExam(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExam ? 'Edit Exam' : 'Schedule Academic / Competitive Exam'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Exam Name / Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operating Systems Mid-Sem or GATE CS Mock #1"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e: any) => setExamType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="college_midterm">College Mid-Semester Exam</option>
              <option value="college_endsem">College End-Semester Exam</option>
              <option value="college_unit_test">College Unit Test / Quiz</option>
              <option value="competitive_mock">Competitive Mock Test (GATE/UPSC/etc.)</option>
              <option value="competitive_final">Competitive Final Exam</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Custom Exam / Not linked --</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!subjectId && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Exam Category / Title
            </label>
            <input
              type="text"
              value={customSubjectName}
              onChange={(e) => setCustomSubjectName(e.target.value)}
              placeholder="e.g. GATE CS 2027 or UPSC GS Paper 1"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Venue / Link
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Hall B or TestPortal.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Score
            </label>
            <input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Total Marks
            </label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Syllabus Coverage / Topics
          </label>
          <textarea
            rows={2}
            value={syllabusCoverage}
            onChange={(e) => setSyllabusCoverage(e.target.value)}
            placeholder="e.g. Units 1-4: CPU Scheduling, Virtual Memory, Deadlocks"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialExam ? 'Update Exam' : 'Schedule Exam'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
