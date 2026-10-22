import api from './api';
import type { ApiResponse, TimetableFormData, TimetableOptions, TimetableScheduleRecord, TimetableWeek } from '../types';

export interface TimetableFilters {
  weekStart: string;
  classId?: string;
  teacherId?: string;
  room?: string;
}

export const timetableService = {
  async getOptions(): Promise<ApiResponse<TimetableOptions>> {
    const response = await api.get<ApiResponse<TimetableOptions>>('/schedules/options');
    return response.data;
  },

  async getWeek(filters: TimetableFilters): Promise<ApiResponse<TimetableWeek>> {
    const params = {
      weekStart: filters.weekStart,
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.room ? { room: filters.room } : {}),
    };
    const response = await api.get<ApiResponse<TimetableWeek>>('/schedules/week', { params });
    return response.data;
  },

  async updateSchedule(id: string, data: TimetableFormData): Promise<ApiResponse<TimetableScheduleRecord>> {
    const response = await api.put<ApiResponse<TimetableScheduleRecord>>(`/schedules/${id}`, data);
    return response.data;
  },
};
