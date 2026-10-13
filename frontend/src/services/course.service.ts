import api from './api';
import type { Course, CourseFormData, CourseQueryParams, PaginatedResponse, ApiResponse } from '../types';

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

  /**
   * Create a new course (Staff / Director)
   */
  createCourse: async (data: CourseFormData): Promise<ApiResponse<Course>> => {
    const response = await api.post<ApiResponse<Course>>('/courses', data);
    return response.data;
  },

  /**
   * Update an existing course (Staff / Director)
   */
  updateCourse: async (id: string, data: Partial<CourseFormData>): Promise<ApiResponse<Course>> => {
    const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course (Staff / Director)
   */
  deleteCourse: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/courses/${id}`);
    return response.data;
  },
};
