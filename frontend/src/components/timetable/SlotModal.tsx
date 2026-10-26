import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { TimetableSlot, Subject, SlotType, SleepSchedule } from '../../types';
import { timetableService } from '../../services/timetableService';
import { AlertTriangle, Clock } from 'lucide-react';

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects: Subject[];
  initialSlot?: TimetableSlot | null;
  sleepSchedule?: SleepSchedule | null;
}

export const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  subjects,
  initialSlot,
  sleepSchedule,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [slotType, setSlotType] = useState<SlotType>('college_lecture');
  const [subjectId, setSubjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [color, setColor] = useState<string>('#6366f1');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSlot) {
      setDayOfWeek(initialSlot.dayOfWeek);
      setStartTime(initialSlot.startTime);
      setEndTime(initialSlot.endTime);
      setSlotType(initialSlot.slotType);
      setSubjectId(initialSlot.subjectId?._id || '');
      setTitle(initialSlot.title);
      setRoom(initialSlot.room || '');
      setNotes(initialSlot.notes || '');
      setColor(initialSlot.color || '#6366f1');
    } else {
      setDayOfWeek(1);
      setStartTime('09:00');
      setEndTime('10:30');
      setSlotType('college_lecture');
      setSubjectId(subjects[0]?._id || '');
      setTitle('');
      setRoom('');
      setNotes('');
      setColor('#6366f1');
    }
    setWarningMessage(null);
  }, [initialSlot, isOpen, subjects]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSubjectId(sId);
    const sub = subjects.find((s) => s._id === sId);
    if (sub) {
      if (!title || title.includes('Lecture') || title.includes('Study')) {
        setTitle(
          slotType === 'self_study'
            ? `${sub.name} Study Session`
            : `${sub.name} Lecture`
        );
      }
      setColor(sub.color || '#6366f1');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setWarningMessage(null);

    try {
      const payload = {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        slotType,
        subjectId: subjectId || undefined,
        title,
        room,
        notes,
        color,
      };

      let res;
      if (initialSlot) {
        res = await timetableService.updateSlot(initialSlot._id, payload);
      } else {
        res = await timetableService.createSlot(payload);
      }

      if (res.warning) {
        setWarningMessage(res.warning);
      }

      onSuccess();
      if (!res.warning) {
        onClose();
      }
    } catch (err: any) {
      setWarningMessage(err.response?.data?.message || 'Error saving slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialSlot ? 'Edit Timetable Slot' : 'Add Weekly Time Slot'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {warningMessage && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">Schedule Note / Conflict Alert:</p>
              <p>{warningMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {days.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Slot Category
            </label>
            <select
              value={slotType}
              onChange={(e) => setSlotType(e.target.value as SlotType)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="college_lecture">College Lecture</option>
              <option value="college_lab">College Practical / Lab</option>
              <option value="college_tutorial">College Tutorial</option>
              <option value="self_study">Self-Study Session</option>
              <option value="exam_prep">Competitive Exam Prep</option>
              <option value="break">Buffer / Break</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Link Subject (Optional)
          </label>
          <select
            value={subjectId}
            onChange={handleSubjectChange}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- No specific subject / General prep --</option>
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>
                {sub.code ? `[${sub.code}] ` : ''}
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Slot Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operating Systems Lecture or GATE Algorithms Revision"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time (24h)
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time (24h)
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Room / Location / Platform
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Hall 204 or Library Study Desk"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Badge Color
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
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key topics to review, homework due, etc."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Saving...' : initialSlot ? 'Update Slot' : 'Save Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
