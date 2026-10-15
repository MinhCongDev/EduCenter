import api from './api';
import type { ApiResponse } from '../types';

// ===========================
// Student Service
// ===========================

// Match backend response shape from /api/student/classes
export interface MyClass {
  _id: string;
  enrollmentId: string;
  class: {
    _id: string;
    classCode: string;
    room: string;
    scheduleDays: string[];
    timeSlot: string;
    startDate: string;
    endDate: string;
    status: string;
    course?: {
      _id: string;
      code: string;
      title: string;
    };
    teacher?: {
      _id: string;
      fullName: string;
      email: string;
    };
  };
  status: string;
  enrollmentStatus: string;
  tuitionStatus: 'PAID' | 'PENDING' | 'UNPAID';
  enrollmentDate: string;
}

export interface Assignment {
  _id: string;
  class: string;
  teacher: string;
  title: string;
  description: string;
  skill: string;
  dueDate: string;
  maxScore: number;
  status: string;
  submissionStatus?: 'PENDING' | 'SUBMITTED' | 'LATE' | 'GRADED';
  submissionId?: string;
  submissionDate?: string;
  score?: number;
}

export interface Attendance {
  _id: string;
  class: string;
  sessionDate: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
}

export interface Grade {
  _id: string;
  student: string;
  class: string;
  teacher: string;
  evaluationType: string;
  title: string;
  testDate: string;
  overallBand?: number;
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
  feedback?: string;
  status: string;
}

export interface Payment {
  _id: string;
  student: string;
  class: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  method?: string;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  createdAt: string;
}

export interface Schedule {
  _id: string;
  class: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  classroom: string;
  topic?: string;
}

export interface ChangeRequest {
  _id: string;
  student: string;
  type: 'CHANGE_CLASS' | 'CHANGE_SCHEDULE' | 'WITHDRAW';
  currentClass?: string;
  requestedClass?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

export const studentService = {
  /**
   * Get student's enrolled classes
   * GET /api/student/classes
   */
  getMyClasses: async (): Promise<ApiResponse<{ classes: MyClass[] }>> => {
    const response = await api.get<ApiResponse<{ classes: MyClass[] }>>('/student/classes');
    return response.data;
  },

  /**
   * Get class details
   * GET /api/student/classes/:id
   */
  getClassDetails: async (classId: string): Promise<ApiResponse<{ class: MyClass }>> => {
    const response = await api.get<ApiResponse<{ class: MyClass }>>(`/student/classes/${classId}`);
    return response.data;
  },

  /**
   * Get assignments for a class
   * GET /api/student/classes/:id/assignments
   */
  getAssignments: async (classId: string): Promise<ApiResponse<{ assignments: Assignment[] }>> => {
    const response = await api.get<ApiResponse<{ assignments: Assignment[] }>>(`/student/classes/${classId}/assignments`);
    return response.data;
  },

  /**
   * Get attendance for a class
   * GET /api/student/classes/:id/attendance
   */
  getAttendance: async (classId: string): Promise<ApiResponse<{ attendance: Attendance[] }>> => {
    const response = await api.get<ApiResponse<{ attendance: Attendance[] }>>(`/student/classes/${classId}/attendance`);
    return response.data;
  },

  /**
   * Get grades for a class
   * GET /api/student/classes/:id/grades
   */
  getGrades: async (classId: string): Promise<ApiResponse<{ grades: Grade[] }>> => {
    const response = await api.get<ApiResponse<{ grades: Grade[] }>>(`/student/classes/${classId}/grades`);
    return response.data;
  },

  /**
   * Get schedule for a class
   * GET /api/student/classes/:id/schedule
   */
  getSchedule: async (classId: string): Promise<ApiResponse<{ schedule: Schedule[] }>> => {
    const response = await api.get<ApiResponse<{ schedule: Schedule[] }>>(`/student/classes/${classId}/schedule`);
    return response.data;
  },

  /**
   * Get payments
   * GET /api/student/payments
   */
  getPayments: async (): Promise<ApiResponse<{ payments: Payment[] }>> => {
    const response = await api.get<ApiResponse<{ payments: Payment[] }>>('/student/payments');
    return response.data;
  },

  /**
   * Get change requests
   * GET /api/student/requests
   */
  getChangeRequests: async (): Promise<ApiResponse<{ requests: ChangeRequest[] }>> => {
    const response = await api.get<ApiResponse<{ requests: ChangeRequest[] }>>('/student/requests');
    return response.data;
  },

  /**
   * Create change request
   * POST /api/student/requests
   */
  createChangeRequest: async (data: Partial<ChangeRequest>): Promise<ApiResponse<{ request: ChangeRequest }>> => {
    const response = await api.post<ApiResponse<{ request: ChangeRequest }>>('/student/requests', data);
    return response.data;
  },

  /**
   * Submit assignment
   * POST /api/student/assignments/:id/submit
   */
  submitAssignment: async (assignmentId: string, formData: FormData): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>(`/student/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default studentService;
