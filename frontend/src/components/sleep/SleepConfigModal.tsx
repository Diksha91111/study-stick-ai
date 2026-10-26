import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SleepSchedule } from '../../types';
import { sleepService } from '../../services/timetableService';
import { Moon, Sparkles } from 'lucide-react';

interface SleepConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSchedule?: SleepSchedule | null;
}

export const SleepConfigModal: React.FC<SleepConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialSchedule,
}) => {
  const [bedTime, setBedTime] = useState('23:30');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [targetSleepHours, setTargetSleepHours] = useState(7.5);
  const [windDownMinutes, setWindDownMinutes] = useState(30);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSchedule) {
      setBedTime(initialSchedule.bedTime || '23:30');
      setWakeTime(initialSchedule.wakeTime || '07:00');
      setTargetSleepHours(initialSchedule.targetSleepHours || 7.5);
      setWindDownMinutes(initialSchedule.windDownMinutes || 30);
      setEnableAlerts(initialSchedule.enableAlerts !== false);
    }
  }, [initialSchedule, isOpen]);

  // Calculate duration between bedTime and wakeTime
  const calculateSleepWindowHours = () => {
    const [bH, bM] = bedTime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let totalB = bH * 60 + bM;
    let totalW = wH * 60 + wM;
    if (totalW <= totalB) {
      totalW += 24 * 60;
    }
    return ((totalW - totalB) / 60).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await sleepService.updateSleepSchedule({
        bedTime,
        wakeTime,
        targetSleepHours: Number(targetSleepHours),
        windDownMinutes: Number(windDownMinutes),
        enableAlerts,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update sleep routine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Circadian Sleep & Recovery Schedule"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Sleep Window: {calculateSleepWindowHours()} Hours
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cognitive consolidation peak occurs during REM cycles
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
            {bedTime} - {wakeTime}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Bedtime
            </label>
            <input
              type="time"
              required
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Wake-up Time
            </label>
            <input
              type="time"
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Sleep Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="4"
              max="12"
              value={targetSleepHours}
              onChange={(e) => setTargetSleepHours(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Wind-down Buffer (Mins)
            </label>
            <input
              type="number"
              min="0"
              step="10"
              max="120"
              value={windDownMinutes}
              onChange={(e) => setWindDownMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Sleep Overlap Conflict Protection
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Warn me whenever a study slot or lecture collides with rest hours
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableAlerts}
              onChange={(e) => setEnableAlerts(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
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
            {isSubmitting ? 'Saving...' : 'Save Routine'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
