import api from './api';
import type {
  ApiResponse,
  ClassFormData,
  ClassDetail,
  ClassCourseOption,
  ClassTeacherOption,
  PaginatedResponse,
  TrainingClass,
} from '../types';

export interface ClassFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ClassOptions {
  courses: ClassCourseOption[];
  teachers: ClassTeacherOption[];
}

export const classService = {
  async getClasses(filters: ClassFilters = {}): Promise<PaginatedResponse<TrainingClass>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    const response = await api.get<PaginatedResponse<TrainingClass>>(`/classes?${params.toString()}`);
    return response.data;
  },

  async getOptions(): Promise<ApiResponse<ClassOptions>> {
    const response = await api.get<ApiResponse<ClassOptions>>('/classes/options');
    return response.data;
  },

  async getClass(id: string): Promise<ApiResponse<ClassDetail>> {
    const response = await api.get<ApiResponse<ClassDetail>>(`/classes/${id}`);
    return response.data;
  },

  async createClass(data: ClassFormData): Promise<ApiResponse<TrainingClass>> {
    const response = await api.post<ApiResponse<TrainingClass>>('/classes', data);
    return response.data;
  },

  async updateClass(id: string, data: ClassFormData): Promise<ApiResponse<TrainingClass>> {
    const response = await api.put<ApiResponse<TrainingClass>>(`/classes/${id}`, data);
    return response.data;
  },

  async deleteClass(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/classes/${id}`);
    return response.data;
  },
};
