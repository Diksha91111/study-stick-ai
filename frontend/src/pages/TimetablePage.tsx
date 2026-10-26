import React, { useState, useEffect } from 'react';
import { timetableService, sleepService } from '../services/timetableService';
import { academicService } from '../services/academicService';
import { TimetableSlot, Subject, SlotType, SleepSchedule } from '../types';
import { SlotModal } from '../components/timetable/SlotModal';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Filter,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const days = [
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
    { value: 7, label: 'Sunday', short: 'Sun' },
  ];

  const fetchTimetableData = async () => {
    try {
      const [slotsData, subjectsData, sleepData] = await Promise.all([
        timetableService.getSlots(),
        academicService.getSubjects(),
        sleepService.getSleepSchedule(),
      ]);
      setSlots(slotsData);
      setSubjects(subjectsData);
      setSleepSchedule(sleepData);
    } catch (err) {
      console.error('Error fetching timetable data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await timetableService.deleteSlot(id);
      fetchTimetableData();
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  const handleEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const filteredSlots = slots.filter((slot) => {
    if (selectedDay !== 'all' && slot.dayOfWeek !== selectedDay) return false;
    if (selectedType !== 'all' && slot.slotType !== selectedType) return false;
    return true;
  });

  const getDaySlots = (dayNum: number) => {
    return slots
      .filter((s) => s.dayOfWeek === dayNum)
      .filter((s) => (selectedType === 'all' ? true : s.slotType === selectedType))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Weekly College & Study Timetable
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Design your weekly rhythm balancing university classes, practical labs, and competitive exam self-study
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Time Slot
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Day Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedDay === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All 7 Days
          </button>
          {days.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedDay === d.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>

        {/* Slot Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Slot Categories</option>
            <option value="college_lecture">College Lectures</option>
            <option value="college_lab">Labs / Practicals</option>
            <option value="college_tutorial">College Tutorials</option>
            <option value="self_study">Self-Study Sessions</option>
            <option value="exam_prep">Competitive Exam Prep</option>
          </select>
        </div>
      </div>

      {/* Grid or Day View */}
      {selectedDay === 'all' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4">
          {days.map((day) => {
            const daySlots = getDaySlots(day.value);
            return (
              <div
                key={day.value}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col h-full"
              >
                <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {day.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                    {daySlots.length} slots
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {daySlots.length > 0 ? (
                    daySlots.map((slot) => {
                      const isStudy = ['self_study', 'exam_prep'].includes(slot.slotType);
                      return (
                        <div
                          key={slot._id}
                          className="p-2.5 rounded-xl border text-xs relative group hover:shadow-md transition-all"
                          style={{
                            borderColor: `${slot.color || '#6366f1'}40`,
                            backgroundColor: `${slot.color || '#6366f1'}10`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className="font-bold line-clamp-1"
                              style={{ color: slot.color || '#6366f1' }}
                            >
                              {slot.title}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleEdit(slot)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(slot._id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-1 font-mono text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          {slot.room && (
                            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{slot.room}</span>
                            </div>
                          )}

                          <span className="mt-1.5 inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                            {slot.slotType.replace('college_', '').replace('_', ' ')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-28 flex items-center justify-center text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-[11px]">
                      Free day / No slots
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single Day Expanded View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Schedule for {days.find((d) => d.value === selectedDay)?.label}
          </h3>
          <div className="space-y-3">
            {getDaySlots(selectedDay as number).map((slot) => (
              <div
                key={slot._id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: slot.color || '#6366f1' }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {slot.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {slot.subjectId?.name} • {slot.room || 'Self Study'} • Category:{' '}
                      {slot.slotType.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(slot)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTimetableData}
        subjects={subjects}
        initialSlot={editingSlot}
        sleepSchedule={sleepSchedule}
      />
    </div>
  );
};
