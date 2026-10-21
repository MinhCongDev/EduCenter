import api from './api';
import type {
  ApiResponse,
  Assignment,
  Attendance,
  AttendanceStats,
  ChangeRequest,
  CreateChangeRequestInput,
  DashboardData,
  Enrollment,
  Grade,
  Payment,
  PaymentStats,
  Schedule as _Schedule,
  StudentProfile,
  Submission,
  User,
  ClassSchedule,
} from '../types';

export type { Enrollment, ClassSchedule };

// =====================================================
// Student Service
// Aligned with backend /api/student/* endpoints
// =====================================================

export const studentService = {
  // ---------------- Aggregate ----------------
  /** GET /api/student/dashboard */
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const res = await api.get<ApiResponse<DashboardData>>('/student/dashboard');
    return res.data;
  },

  /** GET /api/student/profile */
  getMyProfile: async (): Promise<
    ApiResponse<{ user: User; student: StudentProfile | null }>
  > => {
    const res = await api.get<ApiResponse<{ user: User; student: StudentProfile | null }>>(
      '/student/profile'
    );
    return res.data;
  },

  // ---------------- Classes ----------------
  /** GET /api/student/classes */
  getMyClasses: async (): Promise<ApiResponse<{ classes: Enrollment[]; total: number }>> => {
    const res = await api.get<ApiResponse<{ classes: Enrollment[]; total: number }>>(
      '/student/classes'
    );
    return res.data;
  },

  /** GET /api/student/classes/:id */
  getClassDetails: async (classId: string): Promise<ApiResponse<{ class: Enrollment }>> => {
    const res = await api.get<ApiResponse<{ class: Enrollment }>>(`/student/classes/${classId}`);
    return res.data;
  },

  /** GET /api/student/classes/:id/assignments */
  getAssignments: async (classId: string): Promise<ApiResponse<{ assignments: Assignment[] }>> => {
    const res = await api.get<ApiResponse<{ assignments: Assignment[] }>>(
      `/student/classes/${classId}/assignments`
    );
    return res.data;
  },

  /** GET /api/student/classes/:id/attendance */
  getAttendance: async (
    classId: string
  ): Promise<ApiResponse<{ attendance: Attendance[]; stats: AttendanceStats }>> => {
    const res = await api.get<ApiResponse<{ attendance: Attendance[]; stats: AttendanceStats }>>(
      `/student/classes/${classId}/attendance`
    );
    return res.data;
  },

  /** GET /api/student/classes/:id/grades */
  getGrades: async (classId: string): Promise<ApiResponse<{ grades: Grade[] }>> => {
    const res = await api.get<ApiResponse<{ grades: Grade[] }>>(
      `/student/classes/${classId}/grades`
    );
    return res.data;
  },

  /** GET /api/student/classes/:id/schedule */
  getSchedule: async (classId: string): Promise<ApiResponse<{ schedule: ClassSchedule[] }>> => {
    const res = await api.get<ApiResponse<{ schedule: ClassSchedule[] }>>(
      `/student/classes/${classId}/schedule`
    );
    return res.data;
  },

  /** GET /api/student/schedule/all  (M6) */
  getCombinedSchedule: async (): Promise<
    ApiResponse<{ schedule: any[]; classCount: number }>
  > => {
    const res = await api.get<ApiResponse<{ schedule: any[]; classCount: number }>>(
      '/student/schedule/all'
    );
    return res.data;
  },

  // ---------------- Payments ----------------
  /** GET /api/student/payments */
  getPayments: async (): Promise<
    ApiResponse<{ payments: Payment[]; stats: PaymentStats }>
  > => {
    const res = await api.get<ApiResponse<{ payments: Payment[]; stats: PaymentStats }>>(
      '/student/payments'
    );
    return res.data;
  },

  // ---------------- Change Requests ----------------
  /** GET /api/student/requests */
  getChangeRequests: async (): Promise<ApiResponse<{ requests: ChangeRequest[] }>> => {
    const res = await api.get<ApiResponse<{ requests: ChangeRequest[] }>>(
      '/student/requests'
    );
    return res.data;
  },

  /** POST /api/student/requests */
  createChangeRequest: async (
    data: CreateChangeRequestInput
  ): Promise<ApiResponse<{ request: ChangeRequest }>> => {
    const res = await api.post<ApiResponse<{ request: ChangeRequest }>>(
      '/student/requests',
      data
    );
    return res.data;
  },

  /** DELETE /api/student/requests/:id (only if PENDING) */
  cancelChangeRequest: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/student/requests/${id}`);
    return res.data;
  },

  // ---------------- Enrollments (M7) ----------------
  /** POST /api/student/enrollments */
  enrollIntoClass: async (
    classId: string
  ): Promise<ApiResponse<{ enrollment: import('../types').Enrollment }>> => {
    const res = await api.post<ApiResponse<{ enrollment: import('../types').Enrollment }>>(
      '/student/enrollments',
      { classId }
    );
    return res.data;
  },

  // ---------------- Notifications (M4) ----------------
  /** GET /api/student/notifications */
  getMyNotifications: async (limit?: number): Promise<
    ApiResponse<{ items: import('../types').NotificationItem[]; unreadCount: number }>
  > => {
    const res = await api.get<
      ApiResponse<{ items: import('../types').NotificationItem[]; unreadCount: number }>
    >('/student/notifications', { params: limit ? { limit } : undefined });
    return res.data;
  },

  /** PATCH /api/student/notifications/:id/read */
  markNotificationAsRead: async (id: string): Promise<ApiResponse> => {
    const res = await api.patch<ApiResponse>(`/student/notifications/${id}/read`);
    return res.data;
  },

  /** PATCH /api/student/notifications/read-all */
  markAllNotificationsAsRead: async (): Promise<ApiResponse<{ modified: number }>> => {
    const res = await api.patch<ApiResponse<{ modified: number }>>(
      '/student/notifications/read-all'
    );
    return res.data;
  },

  /** DELETE /api/student/notifications/:id */
  deleteNotification: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/student/notifications/${id}`);
    return res.data;
  },

  // ---------------- Submit Assignment ----------------
  /**
   * POST /api/student/assignments/:id/submit
   * Accepts FormData (with optional 'file' and 'content')
   */
  submitAssignment: async (
    assignmentId: string,
    payload: { file?: File | null; content?: string }
  ): Promise<ApiResponse<{ submission: Submission }>> => {
    const formData = new FormData();
    if (payload.file) formData.append('file', payload.file);
    if (payload.content) formData.append('content', payload.content);

    const res = await api.post<ApiResponse<{ submission: Submission }>>(
      `/student/assignments/${assignmentId}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data;
  },
};

export default studentService;
