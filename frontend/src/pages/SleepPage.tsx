import React, { useState, useEffect } from 'react';
import { sleepService } from '../services/timetableService';
import { SleepSchedule } from '../types';
import { SleepConfigModal } from '../components/sleep/SleepConfigModal';
import {
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  BedDouble,
  Brain,
  Edit2,
} from 'lucide-react';

export const SleepPage: React.FC = () => {
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule | null>(null);
  const [conflictData, setConflictData] = useState<{
    conflicts: any[];
    safe: boolean;
  }>({ conflicts: [], safe: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSleepData = async () => {
    try {
      const [schedule, conflicts] = await Promise.all([
        sleepService.getSleepSchedule(),
        sleepService.getSleepConflicts(),
      ]);
      setSleepSchedule(schedule);
      setConflictData(conflicts);
    } catch (err) {
      console.error('Error fetching sleep data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleepData();
  }, []);

  const bedTime = sleepSchedule?.bedTime || '23:30';
  const wakeTime = sleepSchedule?.wakeTime || '07:00';
  const targetHours = sleepSchedule?.targetSleepHours || 7.5;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Moon className="w-6 h-6 text-indigo-500" />
            Sleep Schedule & Circadian Guard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Maintain optimal neuroplasticity and long-term memory retention by protecting consistent rest cycles
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Edit2 className="w-4 h-4" /> Configure Sleep Routine
        </button>
      </div>

      {/* Routine Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Night Bedtime</p>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {bedTime}
            </p>
            <p className="text-[11px] text-slate-400">Wind-down begins 30m prior</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Wake-up Call</p>
            <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
              {wakeTime}
            </p>
            <p className="text-[11px] text-slate-400">High-focus morning window</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500">Target Rest</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {targetHours} <span className="text-sm font-normal text-slate-500">Hours</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold">Recommended for students</p>
          </div>
        </div>
      </div>

      {/* 24-Hour Circadian Day Visualizer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          24-Hour Circadian Phase Blueprint
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Visual distribution of your day: Sleep window, peak morning focus, college schedule, and recovery buffer
        </p>

        {/* Linear 24-Hour Timeline Bar */}
        <div className="relative h-12 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center shadow-inner border border-slate-200 dark:border-slate-700">
          {/* Midnight to Wake */}
          <div className="h-full bg-indigo-950 text-indigo-300 flex items-center justify-center text-[10px] font-mono font-bold px-2 w-[29%]">
            Rest (00:00 - {wakeTime})
          </div>
          {/* Morning Deep Focus */}
          <div className="h-full bg-emerald-600/80 text-white flex items-center justify-center text-[10px] font-semibold px-2 w-[21%]">
            Morning Deep Focus
          </div>
          {/* College Core Hours */}
          <div className="h-full bg-blue-600/80 text-white flex items-center justify-center text-[10px] font-semibold px-2 w-[25%]">
            College Lectures & Labs
          </div>
          {/* Evening Revision */}
          <div className="h-full bg-purple-600/80 text-white flex items-center justify-center text-[10px] font-semibold px-2 w-[20%]">
            Exam Prep
          </div>
          {/* Wind-down */}
          <div className="h-full bg-indigo-900 text-indigo-200 flex items-center justify-center text-[10px] font-mono font-bold px-2 w-[5%]">
            Sleep
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-950 border border-indigo-800" />
            <span className="text-slate-600 dark:text-slate-400">Sleep Window ({bedTime} - {wakeTime})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Deep Work & Practice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">University Lectures</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">Competitive Revision</span>
          </div>
        </div>
      </div>

      {/* Timetable Conflict Audit */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Timetable Sleep Collision Audit
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              conflictData.safe
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {conflictData.safe
              ? '✓ Routine Safe: 0 Collisions'
              : `⚠ ${conflictData.conflicts.length} Overlap(s) Detected`}
          </span>
        </div>

        {conflictData.safe ? (
          <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Your study schedule perfectly respects your biological sleep clock.
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1">
                No lectures or late-night cramming sessions overlap with your {bedTime} - {wakeTime} rest period. Consistent sleep enhances problem-solving agility in exams like GATE and competitive tests.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conflictData.conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                      Collision: "{conflict.title}" ({conflict.startTime} - {conflict.endTime})
                    </h5>
                    <p className="text-xs text-rose-800 dark:text-rose-400 mt-0.5">
                      {conflict.reason}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <SleepConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSleepData}
        initialSchedule={sleepSchedule}
      />
    </div>
  );
};
