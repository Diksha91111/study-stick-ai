import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Task, Subject, TaskType, TaskPriority, TaskStatus, Milestone } from '../../types';
import { academicService } from '../../services/academicService';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects: Subject[];
  initialTask?: Task | null;
  defaultType?: TaskType;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subjects,
  initialTask,
  defaultType = 'assignment',
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(defaultType);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [weightagePercentage, setWeightagePercentage] = useState(10);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isVivaPrepared, setIsVivaPrepared] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setSubjectId(initialTask.subjectId?._id || '');
      setTaskType(initialTask.taskType);
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
      setDueDate(
        initialTask.dueDate
          ? new Date(initialTask.dueDate).toISOString().slice(0, 16)
          : ''
      );
      setDescription(initialTask.description || '');
      setEstimatedHours(initialTask.estimatedHours || 2);
      setWeightagePercentage(initialTask.weightagePercentage || 0);
      setMilestones(initialTask.milestones || []);
      setIsVivaPrepared(initialTask.isVivaPrepared || false);
      setSubmissionNotes(initialTask.submissionNotes || '');
    } else {
      setTitle('');
      setSubjectId(subjects[0]?._id || '');
      setTaskType(defaultType);
      setPriority('medium');
      setStatus('pending');
      // Default due in 3 days at 23:59
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(23, 59, 0, 0);
      setDueDate(d.toISOString().slice(0, 16));
      setDescription('');
      setEstimatedHours(3);
      setWeightagePercentage(10);
      setMilestones([]);
      setIsVivaPrepared(false);
      setSubmissionNotes('');
    }
    setError(null);
  }, [initialTask, isOpen, defaultType, subjects]);

  const addMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones((prev) => [
      ...prev,
      { title: newMilestoneTitle.trim(), completed: false },
    ]);
    setNewMilestoneTitle('');
  };

  const removeMilestone = (idx: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleMilestone = (idx: number) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        subjectId: subjectId || undefined,
        taskType,
        priority,
        status,
        dueDate: new Date(dueDate).toISOString(),
        description,
        estimatedHours: Number(estimatedHours),
        weightagePercentage: Number(weightagePercentage),
        milestones,
        isVivaPrepared,
        submissionNotes,
      };

      if (initialTask) {
        await academicService.updateTask(initialTask._id, payload);
      } else {
        await academicService.createTask(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Edit Academic Task' : 'Create Academic Task / Deadline'}
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
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design TCP Socket Client or OS Shell Project"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={taskType}
              onChange={(e: any) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="assignment">Assignment</option>
              <option value="project">Project / Capstone</option>
              <option value="practical">Lab / Practical</option>
              <option value="homework">Homework / Reading</option>
              <option value="other">Other Academic</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e: any) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="urgent" className="text-rose-600 font-bold">
                🔥 Urgent (Do First)
              </option>
              <option value="high" className="text-amber-600 font-bold">
                ⚡ High Priority
              </option>
              <option value="medium" className="text-indigo-600">
                Medium Priority
              </option>
              <option value="low" className="text-slate-500">
                Low Priority
              </option>
            </select>
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
              <option value="pending">⏳ Pending</option>
              <option value="in_progress">🚧 In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- General / No Subject --</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deadline / Due Date *
            </label>
            <input
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Milestone Tracker for Projects */}
        {taskType === 'project' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Project Milestones
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Add milestone (e.g. Architecture diagram, backend API)..."
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMilestone();
                  }
                }}
              />
              <button
                type="button"
                onClick={addMilestone}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {milestones.length > 0 && (
              <div className="space-y-1 mt-2 max-h-36 overflow-y-auto">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(idx)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          m.completed
                            ? 'text-emerald-500 fill-emerald-500/20'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                      <span
                        className={
                          m.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        }
                      >
                        {m.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Practical viva prep checkbox */}
        {taskType === 'practical' && (
          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Viva & Lab Exam Readiness
              </p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                Have you reviewed the theoretical questions & experiment code?
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isVivaPrepared}
                onChange={(e) => setIsVivaPrepared(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description & Instructions (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specific guidelines, format, submission portal link, etc."
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
            {isSubmitting ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
