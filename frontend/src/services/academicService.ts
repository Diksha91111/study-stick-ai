import api from './api';
import { Subject, Task, Exam } from '../types';

export const academicService = {
  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const res = await api.get('/subjects');
    return res.data.data;
  },

  async createSubject(data: Partial<Subject>): Promise<Subject> {
    const res = await api.post('/subjects', data);
    return res.data.data;
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    const res = await api.put(`/subjects/${id}`, data);
    return res.data.data;
  },

  async deleteSubject(id: string): Promise<void> {
    await api.delete(`/subjects/${id}`);
  },

  // Tasks (Assignments, Projects, Practicals)
  async getTasks(params?: {
    taskType?: string;
    priority?: string;
    status?: string;
    subjectId?: string;
  }): Promise<Task[]> {
    const res = await api.get('/tasks', { params });
    return res.data.data;
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await api.post('/tasks', data);
    return res.data.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  // Exams
  async getExams(params?: { status?: string; examType?: string }): Promise<Exam[]> {
    const res = await api.get('/exams', { params });
    return res.data.data;
  },

  async createExam(data: Partial<Exam>): Promise<Exam> {
    const res = await api.post('/exams', data);
    return res.data.data;
  },

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    const res = await api.put(`/exams/${id}`, data);
    return res.data.data;
  },

  async deleteExam(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
};
