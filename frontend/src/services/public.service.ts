import api from './api';
import type { ApiResponse, Class } from '../types';

export const publicService = {
  /** GET /api/public/classes — public catalog of OPEN/IN_PROGRESS classes */
  getOpenClasses: async (): Promise<ApiResponse<{ classes: Class[]; total: number }>> => {
    const res = await api.get<ApiResponse<{ classes: Class[]; total: number }>>(
      '/public/classes'
    );
    return res.data;
  },

  /** GET /api/public/classes/:id */
  getClassById: async (id: string): Promise<ApiResponse<{ class: Class }>> => {
    const res = await api.get<ApiResponse<{ class: Class }>>(`/public/classes/${id}`);
    return res.data;
  },

  /** GET /api/public/courses */
  getCourses: async (): Promise<ApiResponse<{ courses: any[]; total: number }>> => {
    const res = await api.get<ApiResponse<{ courses: any[]; total: number }>>(
      '/public/courses'
    );
    return res.data;
  },
};

export default publicService;
