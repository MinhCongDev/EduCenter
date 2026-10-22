import api from './api';
import type { ApiResponse, EnrollmentOptions, EnrollmentRecord, PaginatedResponse } from '../types';

export interface EnrollmentFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  courseId?: string;
  classId?: string;
  page?: number;
  limit?: number;
}

export const enrollmentService = {
  async getEnrollments(filters: EnrollmentFilters = {}): Promise<PaginatedResponse<EnrollmentRecord>> {
    const response = await api.get<PaginatedResponse<EnrollmentRecord>>('/enrollments', { params: filters });
    return response.data;
  },

  async getOptions(): Promise<ApiResponse<EnrollmentOptions>> {
    const response = await api.get<ApiResponse<EnrollmentOptions>>('/enrollments/options');
    return response.data;
  },

  async getEnrollment(id: string): Promise<ApiResponse<EnrollmentRecord>> {
    const response = await api.get<ApiResponse<EnrollmentRecord>>(`/enrollments/${id}`);
    return response.data;
  },
};
