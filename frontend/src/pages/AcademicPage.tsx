import React, { useState, useEffect } from 'react';
import { academicService } from '../services/academicService';
import { Task, Subject, TaskType } from '../types';
import { TaskModal } from '../components/academic/TaskModal';
import { SubjectModal } from '../components/academic/SubjectModal';
import { CountdownTimer } from '../components/common/CountdownTimer';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  Filter,
  Search,
  FolderGit2,
  FlaskConical,
} from 'lucide-react';

export const AcademicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'subjects' | 'projects' | 'practicals'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [defaultTaskType, setDefaultTaskType] = useState<TaskType>('assignment');

  const fetchData = async () => {
    try {
      const [tasksData, subjectsData] = await Promise.all([
        academicService.getTasks(),
        academicService.getSubjects(),
      ]);
      setTasks(tasksData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error fetching academic data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await academicService.updateTask(task._id, { status: nextStatus });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await academicService.deleteTask(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;
    try {
      await academicService.deleteSubject(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    // Tab filter
    if (activeTab === 'projects' && task.taskType !== 'project') return false;
    if (activeTab === 'practicals' && task.taskType !== 'practical') return false;
    if (activeTab === 'tasks' && (task.taskType === 'project' || task.taskType === 'practical')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchSub = task.subjectId?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchSub) return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    // Status filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Academics, Assignments & Projects
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track university subjects, syllabus completion, assignment deadlines, and practical viva readiness
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
          <button
            onClick={() => {
              setEditingTask(null);
              setDefaultTaskType(
                activeTab === 'projects'
                  ? 'project'
                  : activeTab === 'practicals'
                  ? 'practical'
                  : 'assignment'
              );
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Deadline
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Assignments & Deadlines
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Subjects & Syllabus ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FolderGit2 className="w-4 h-4" /> Projects & Milestones
        </button>
        <button
          onClick={() => setActiveTab('practicals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'practicals'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Practicals & Viva
        </button>
      </div>

      {/* Tab 1: Subjects & Syllabus Progress View */}
      {activeTab === 'subjects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      backgroundColor: `${sub.color || '#6366f1'}20`,
                      color: sub.color || '#6366f1',
                    }}
                  >
                    {sub.code || 'CORE'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSubject(sub);
                        setIsSubjectModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(sub._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sub.professor ? `Prof. ${sub.professor} • ` : ''}
                  {sub.credits} Credits • {sub.category.replace('_', ' ')}
                </p>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Syllabus Coverage</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {sub.syllabusProgress || 0}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${sub.syllabusProgress || 0}%`,
                        backgroundColor: sub.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Target: {sub.totalHoursTarget || 40} Study Hrs</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Active in Timetable
                </span>
              </div>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No subjects registered yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add your current college courses to track syllabus and link assignments.
              </p>
              <button
                onClick={() => setIsSubjectModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                + Add First Subject
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Tasks, Projects, Practicals List */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or subject..."
                className="w-full px-2 py-1 text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px] font-semibold">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="urgent">🔥 Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px] font-semibold">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task._id}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                    isCompleted
                      ? 'border-slate-200/60 dark:border-slate-800/60 opacity-75'
                      : task.priority === 'urgent'
                      ? 'border-rose-300 dark:border-rose-900/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`mt-0.5 p-1 rounded-lg transition-colors ${
                          isCompleted
                            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : task.priority === 'high'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                            {task.taskType}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {task.subjectId?.name || 'Academic'} • Weightage:{' '}
                          {task.weightagePercentage || 0}% • Est. Hours:{' '}
                          {task.estimatedHours || 2}h
                        </p>

                        {task.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        {/* Project Milestones overview */}
                        {task.milestones && task.milestones.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-slate-400 text-[11px]">Milestones:</span>
                            <div className="flex items-center gap-1">
                              {task.milestones.map((m, i) => (
                                <span
                                  key={i}
                                  title={m.title}
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    m.completed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-slate-500">
                              {task.milestones.filter((m) => m.completed).length} /{' '}
                              {task.milestones.length} Done
                            </span>
                          </div>
                        )}

                        {/* Practical viva prep status */}
                        {task.taskType === 'practical' && (
                          <div className="mt-2 inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.isVivaPrepared
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                              }`}
                            >
                              {task.isVivaPrepared ? '✓ Viva Ready' : '⚠ Viva Prep Needed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <CountdownTimer targetDate={task.dueDate} size="sm" />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                No items match your selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchData}
        subjects={subjects}
        initialTask={editingTask}
        defaultType={defaultTaskType}
      />
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSuccess={fetchData}
        initialSubject={editingSubject}
      />
    </div>
  );
};
