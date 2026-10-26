import api from './api';
import { TimetableSlot, SleepSchedule, DashboardStats } from '../types';

export const timetableService = {
  async getSlots(dayOfWeek?: number): Promise<TimetableSlot[]> {
    const res = await api.get('/timetable', { params: { dayOfWeek } });
    return res.data.data;
  },

  async createSlot(data: Partial<TimetableSlot>): Promise<{
    slot: TimetableSlot;
    warning: string | null;
    hasSleepConflict: boolean;
    hasTimetableConflict: boolean;
  }> {
    const res = await api.post('/timetable', data);
    return res.data.data;
  },

  async updateSlot(id: string, data: Partial<TimetableSlot>): Promise<{
    slot: TimetableSlot;
    warning: string | null;
  }> {
    const res = await api.put(`/timetable/${id}`, data);
    return res.data.data;
  },

  async deleteSlot(id: string): Promise<void> {
    await api.delete(`/timetable/${id}`);
  },
};

export const sleepService = {
  async getSleepSchedule(): Promise<SleepSchedule> {
    const res = await api.get('/sleep');
    return res.data.data;
  },

  async updateSleepSchedule(data: Partial<SleepSchedule>): Promise<SleepSchedule> {
    const res = await api.put('/sleep', data);
    return res.data.data;
  },

  async getSleepConflicts(): Promise<{
    conflicts: any[];
    safe: boolean;
    sleepSchedule: SleepSchedule;
  }> {
    const res = await api.get('/sleep/conflicts');
    return res.data.data;
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data.data;
  },
};
