import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Subject } from '../../types';
import { academicService } from '../../services/academicService';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSubject?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSubject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [credits, setCredits] = useState(4);
  const [professor, setProfessor] = useState('');
  const [syllabusProgress, setSyllabusProgress] = useState(0);
  const [category, setCategory] = useState<
    'college_core' | 'college_elective' | 'competitive_exam' | 'skill_development'
  >('college_core');
  const [totalHoursTarget, setTotalHoursTarget] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubject) {
      setName(initialSubject.name);
      setCode(initialSubject.code || '');
      setColor(initialSubject.color || '#6366f1');
      setCredits(initialSubject.credits || 4);
      setProfessor(initialSubject.professor || '');
      setSyllabusProgress(initialSubject.syllabusProgress || 0);
      setCategory(initialSubject.category || 'college_core');
      setTotalHoursTarget(initialSubject.totalHoursTarget || 40);
    } else {
      setName('');
      setCode('');
      setColor('#6366f1');
      setCredits(4);
      setProfessor('');
      setSyllabusProgress(0);
      setCategory('college_core');
      setTotalHoursTarget(40);
    }
    setError(null);
  }, [initialSubject, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        code,
        color,
        credits: Number(credits),
        professor,
        syllabusProgress: Number(syllabusProgress),
        category,
        totalHoursTarget: Number(totalHoursTarget),
      };

      if (initialSubject) {
        await academicService.updateSubject(initialSubject._id, payload);
      } else {
        await academicService.createSubject(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSubject ? 'Edit Subject' : 'Add Academic Subject'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Subject Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operating Systems, Computer Networks"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CS501"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="college_core">College Core</option>
              <option value="college_elective">College Elective</option>
              <option value="competitive_exam">Competitive Exam Prep</option>
              <option value="skill_development">Skill / Minor</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Credits
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-1 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500">{color}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Professor / Instructor
          </label>
          <input
            type="text"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            placeholder="e.g. Dr. A. Sharma"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Syllabus Completion
            </label>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {syllabusProgress}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={syllabusProgress}
            onChange={(e) => setSyllabusProgress(Number(e.target.value))}
            className="w-full accent-indigo-600"
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
            {isSubmitting ? 'Saving...' : initialSubject ? 'Update Subject' : 'Save Subject'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
