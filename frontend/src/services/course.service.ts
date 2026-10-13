import api from './api';
import type { Course, CourseQueryParams, PaginatedResponse, ApiResponse } from '../types';

export const courseService = {
  /**
   * UC02: View Courses List
   * UC04: Search Courses
   * UC05: Filter Courses
   */
  getCourses: async (params?: CourseQueryParams): Promise<PaginatedResponse<Course>> => {
    const response = await api.get<PaginatedResponse<Course>>('/courses', { params });
    return response.data;
  },

  /**
   * UC03: View Courses Detail
   */
  getCourseById: async (id: string): Promise<ApiResponse<Course>> => {
    const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  },
};
