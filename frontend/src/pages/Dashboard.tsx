import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/timetableService';
import { academicService } from '../services/academicService';
import { DashboardStats, Subject, TimetableSlot } from '../types';
import { StatCard } from '../components/common/StatCard';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { TaskModal } from '../components/academic/TaskModal';
import { ExamModal } from '../components/academic/ExamModal';
import { SlotModal } from '../components/timetable/SlotModal';
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Clock,
  Moon,
  AlertTriangle,
  Plus,
  ArrowRight,
  Flame,
  CheckCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      const [statsData, subjectsData] = await Promise.all([
        dashboardService.getStats(),
        academicService.getSubjects(),
      ]);
      setStats(statsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMarkComplete = async (taskId: string) => {
    try {
      await academicService.updateTask(taskId, { status: 'completed' });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Synthesizing study routine & deadlines...
          </p>
        </div>
      </div>
    );
  }

  const nearestTarget = stats?.nearestExam;
  const metrics = stats?.metrics;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Banner with Live Countdown */}
      {nearestTarget ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/20 border border-indigo-700/50">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-200">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                Nearest Milestone Countdown
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {nearestTarget.title}
              </h2>
              <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
                {nearestTarget.subjectId
                  ? `${nearestTarget.subjectId.name} (${nearestTarget.subjectId.code})`
                  : nearestTarget.customSubjectName || 'Competitive Exam'}
                {nearestTarget.venue && ` • Venue: ${nearestTarget.venue}`}
                {` • Target Score: ${nearestTarget.targetScore}/${nearestTarget.totalMarks}`}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20">
              <CountdownTimer
                targetDate={nearestTarget.examDate}
                label="Time Remaining"
                size="lg"
                showSeconds={true}
              />
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">No upcoming exams scheduled yet!</h2>
            <p className="text-xs text-indigo-100 mt-1">
              Add your midterm, endsem, or GATE/UPSC mock tests to activate countdown timers.
            </p>
          </div>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Schedule Exam
          </button>
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Subjects Enrolled"
          value={metrics?.totalSubjects || 0}
          subtitle={`Avg Syllabus: ${metrics?.avgSyllabusProgress || 0}%`}
          icon={<BookOpen className="w-5 h-5" />}
          colorScheme="indigo"
        />
        <StatCard
          title="Pending Tasks"
          value={metrics?.pendingTasksCount || 0}
          subtitle={`${metrics?.urgentTasksCount || 0} marked high/urgent`}
          icon={<CalendarCheck className="w-5 h-5" />}
          colorScheme={metrics?.urgentTasksCount ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Scheduled Exams"
          value={metrics?.upcomingExamsCount || 0}
          subtitle="Midterm, Endsem & Mocks"
          icon={<GraduationCap className="w-5 h-5" />}
          colorScheme="purple"
        />
        <StatCard
          title="Today's Timetable"
          value={`${metrics?.todayCollegeHours || 0} Lec / ${metrics?.todayStudyHours || 0} Study`}
          subtitle="College lectures vs study slots"
          icon={<Clock className="w-5 h-5" />}
          colorScheme="amber"
        />
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Quick Academic Actions:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Task
          </button>
          <button
            onClick={() => setIsSlotModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Time Slot
          </button>
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Exam
          </button>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (2 Columns: Today's Schedule + Deadlines & Sleep) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Today's Schedule & Slots
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time timeline balancing college hours and self-study blocks
                </p>
              </div>
              <Link
                to="/timetable"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View 7-Day Grid <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.todaySlots && stats.todaySlots.length > 0 ? (
              <div className="space-y-3">
                {stats.todaySlots.map((slot: TimetableSlot) => {
                  const isStudy = ['self_study', 'exam_prep'].includes(slot.slotType);
                  return (
                    <div
                      key={slot._id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                        isStudy
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0 mt-0.5 sm:mt-0"
                          style={{ backgroundColor: slot.color || '#6366f1' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {slot.title}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isStudy
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                              }`}
                            >
                              {slot.slotType.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {slot.subjectId ? `${slot.subjectId.name} • ` : ''}
                            {slot.room ? `Location: ${slot.room}` : 'Self-study desk'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 sm:mt-0 flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No slots scheduled for today yet.
                </p>
                <button
                  onClick={() => setIsSlotModalOpen(true)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add today's classes or study slot
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Upcoming Deadlines & Sleep Guard */}
        <div className="space-y-6">
          {/* Priority Deadlines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Urgent Deadlines
              </h3>
              <Link
                to="/academic"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Tasks
              </Link>
            </div>

            {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingDeadlines.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mb-1 ${
                            item.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.subject} • {item.type}
                        </p>
                      </div>

                      {item.kind === 'task' && (
                        <button
                          onClick={() => handleMarkComplete(item.id)}
                          title="Mark Complete"
                          className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Remaining:</span>
                      <CountdownTimer targetDate={item.deadline} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 p-4 text-center">
                🎉 No pressing deadlines pending. Great job staying ahead!
              </p>
            )}
          </div>

          {/* Sleep Routine Guard Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Sleep Schedule Guard
              </h3>
              <Link
                to="/sleep"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Routine
              </Link>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Rest Window:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.sleepSchedule?.bedTime || '23:30'} ➔{' '}
                  {stats?.sleepSchedule?.wakeTime || '07:00'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Target Sleep:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {stats?.sleepSchedule?.targetSleepHours || 7.5} Hours / Night
                </span>
              </div>
            </div>

            {stats?.sleepConflicts && stats.sleepConflicts.length > 0 ? (
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Sleep Intrusion Detected!
                </div>
                {stats.sleepConflicts.map((c, i) => (
                  <p key={i} className="text-[11px]">
                    "{c.slotTitle}" ({c.time}) encroaches into your rest hours.
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Zero conflicts with designated sleep hours.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={fetchDashboardData}
        subjects={subjects}
      />
      <ExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSuccess={fetchDashboardData}
        subjects={subjects}
      />
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        onSuccess={fetchDashboardData}
        subjects={subjects}
        sleepSchedule={stats?.sleepSchedule}
      />
    </div>
  );
};
