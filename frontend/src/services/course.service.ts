import api from './api';
import type { Course, CourseFormData, PaginatedResponse, ApiResponse } from '../types';

export interface CourseFilters {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ===========================
// Course Service
// ===========================
export const courseService = {
  /**
   * Fetch all courses with optional filtering / pagination
   */
  async getCourses(filters: CourseFilters = {}): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    if (filters.status)   params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search)   params.append('search', filters.search);
    if (filters.page)     params.append('page', String(filters.page));
    if (filters.limit)    params.append('limit', String(filters.limit));

    const response = await api.get<PaginatedResponse<Course>>(`/courses?${params.toString()}`);
    return response.data;
  },

  /**
   * Fetch single course by ID
   */
  async getCourseById(id: string): Promise<ApiResponse<Course>> {
    const response = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return response.data;
  },

  /**
   * Create a new course (Staff / Director)
   */
  async createCourse(data: CourseFormData): Promise<ApiResponse<Course>> {
    const response = await api.post<ApiResponse<Course>>('/courses', data);
    return response.data;
  },

  /**
   * Update an existing course (Staff / Director)
   */
  async updateCourse(id: string, data: Partial<CourseFormData>): Promise<ApiResponse<Course>> {
    const response = await api.put<ApiResponse<Course>>(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course (Staff / Director)
   */
  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete<ApiResponse<void>>(`/courses/${id}`);
    return response.data;
  },
};
