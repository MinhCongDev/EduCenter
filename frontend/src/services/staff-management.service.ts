import api from './api';
import type {
  ApiResponse,
  ManagedStudent,
  ManagedStudentDetail,
  ManagedTeacher,
  ManagedTeacherDetail,
  PaginatedResponse,
  UserStatus,
} from '../types';

export interface StudentManagementFilters {
  search?: string;
  fromDate?: string;
  toDate?: string;
  classId?: string;
  completion?: '' | 'COMPLETED' | 'IN_PROGRESS';
  page?: number;
  limit?: number;
}

export interface StudentManagementOptions {
  classes: {
    _id: string;
    classCode: string;
    course: { _id: string; code: string; title: string } | null;
  }[];
}

export const staffManagementService = {
  async getStudents(filters: StudentManagementFilters = {}): Promise<PaginatedResponse<ManagedStudent>> {
    const response = await api.get<PaginatedResponse<ManagedStudent>>('/staff-management/students', { params: filters });
    return response.data;
  },

  async getStudentOptions(): Promise<ApiResponse<StudentManagementOptions>> {
    const response = await api.get<ApiResponse<StudentManagementOptions>>('/staff-management/students/options');
    return response.data;
  },

  async getStudent(id: string): Promise<ApiResponse<ManagedStudentDetail>> {
    const response = await api.get<ApiResponse<ManagedStudentDetail>>(`/staff-management/students/${id}`);
    return response.data;
  },

  async getTeachers(filters: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResponse<ManagedTeacher>> {
    const response = await api.get<PaginatedResponse<ManagedTeacher>>('/staff-management/teachers', { params: filters });
    return response.data;
  },

  async getTeacher(id: string): Promise<ApiResponse<ManagedTeacherDetail>> {
    const response = await api.get<ApiResponse<ManagedTeacherDetail>>(`/staff-management/teachers/${id}`);
    return response.data;
  },

  async updateAccountStatus(id: string, status: Extract<UserStatus, 'ACTIVE' | 'SUSPENDED'>): Promise<ApiResponse<unknown>> {
    const response = await api.patch<ApiResponse<unknown>>(`/staff-management/accounts/${id}/status`, { status });
    return response.data;
  },
};
