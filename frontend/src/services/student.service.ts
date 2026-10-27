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
  OpenClass,
  Payment,
  PaymentMethod,
  PaymentStats,
  PaymentStatus,
  StudentProfile,
  Submission,
  TuitionItem,
  TuitionStats,
  TuitionStatus,
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

  /**
   * PUT /api/student/profile
   * Cập nhật phần hồ sơ RIÊNG của học viên (band mục tiêu, mục tiêu học tập,
   * liên hệ khẩn cấp). Thông tin User (tên, SĐT, địa chỉ) dùng
   * `authService.updateProfile`.
   */
  updateMyProfile: async (data: {
    /** `null` = xoá band mục tiêu; bỏ trống (undefined) = giữ nguyên. */
    targetBand?: number | null;
    learningGoal?: string;
    emergencyContact?: {
      name?: string;
      relationship?: string;
      phone?: string;
    };
  }): Promise<ApiResponse<{ student: StudentProfile }>> => {
    const res = await api.put<ApiResponse<{ student: StudentProfile }>>(
      '/student/profile',
      data
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

  /** GET /api/student/open-classes — lớp đang MỞ để học viên tự ghi danh */
  getOpenClasses: async (
    search?: string
  ): Promise<
    ApiResponse<{ classes: import('../types').OpenClass[]; total: number }>
  > => {
    const res = await api.get<
      ApiResponse<{ classes: import('../types').OpenClass[]; total: number }>
    >('/student/open-classes', { params: search ? { search } : undefined });
    return res.data;
  },

  /**
   * GET /api/student/transfer-target-classes
   * Lớp ĐÍCH cho yêu cầu đổi lớp — gồm cả lớp `IN_PROGRESS` (đang chạy),
   * vì chuyển lớp giữa kỳ là tình huống hợp lệ.
   */
  getTransferTargetClasses: async (
    search?: string
  ): Promise<ApiResponse<{ classes: OpenClass[]; total: number }>> => {
    const res = await api.get<ApiResponse<{ classes: OpenClass[]; total: number }>>(
      '/student/transfer-target-classes',
      { params: search ? { search } : undefined }
    );
    return res.data;
  },

  /** GET /api/student/classes/:id */
  getClassDetails: async (classId: string): Promise<ApiResponse<{ class: Enrollment }>> => {
    const res = await api.get<ApiResponse<{ class: Enrollment }>>(`/student/classes/${classId}`);
    return res.data;
  },

  /** GET /api/student/classes/:id/assignments */
  getAssignments: async (
    classId: string
  ): Promise<ApiResponse<{ assignments: Assignment[]; skills: string[] }>> => {
    const res = await api.get<ApiResponse<{ assignments: Assignment[]; skills: string[] }>>(
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

  // ---------------- Tuition (M8) ----------------
  /** GET /api/student/tuition — học phí theo từng lớp đã ghi danh */
  getTuition: async (): Promise<
    ApiResponse<{ items: TuitionItem[]; stats: TuitionStats }>
  > => {
    const res = await api.get<
      ApiResponse<{ items: TuitionItem[]; stats: TuitionStats }>
    >('/student/tuition');
    return res.data;
  },

  /** POST /api/student/tuition/:enrollmentId/pay — thanh toán học phí */
  payTuition: async (
    enrollmentId: string,
    method: PaymentMethod = 'VNPAY'
  ): Promise<
    ApiResponse<{
      payment: {
        _id: string;
        amount: number;
        method: PaymentMethod;
        transactionCode: string;
        status: PaymentStatus;
        paymentDate: string;
      };
      enrollmentId: string;
      tuitionStatus: TuitionStatus;
    }>
  > => {
    const res = await api.post<
      ApiResponse<{
        payment: {
          _id: string;
          amount: number;
          method: PaymentMethod;
          transactionCode: string;
          status: PaymentStatus;
          paymentDate: string;
        };
        enrollmentId: string;
        tuitionStatus: TuitionStatus;
      }>
    >(`/student/tuition/${enrollmentId}/pay`, { method });
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

  /** DELETE /api/student/enrollments/:enrollmentId — rút khỏi lớp học */
  dropFromClass: async (
    enrollmentId: string
  ): Promise<
    ApiResponse<{
      enrollmentId: string;
      status: 'DROPPED';
      tuitionStatus: TuitionStatus;
    }>
  > => {
    const res = await api.delete<
      ApiResponse<{
        enrollmentId: string;
        status: 'DROPPED';
        tuitionStatus: TuitionStatus;
      }>
    >(`/student/enrollments/${enrollmentId}`);
    return res.data;
  },

  // ---------------- Feedback (đánh giá lớp học) ----------------
  /**
   * GET /api/student/classes/:id/feedback
   * Phản hồi của chính học viên về lớp học.
   */
  getMyClassFeedback: async (
    classId: string
  ): Promise<ApiResponse<{ items: import('../types').ClassFeedback[] }>> => {
    const res = await api.get<ApiResponse<{ items: import('../types').ClassFeedback[] }>>(
      `/student/classes/${classId}/feedback`
    );
    return res.data;
  },

  /**
   * POST /api/student/classes/:id/feedback
   * Gửi / cập nhật phản hồi về lớp học (1 phản hồi / 1 lớp).
   */
  submitClassFeedback: async (
    classId: string,
    payload: { content: string; rating: number; tags?: string[] }
  ): Promise<ApiResponse<{ feedback: import('../types').ClassFeedback }>> => {
    const res = await api.post<ApiResponse<{ feedback: import('../types').ClassFeedback }>>(
      `/student/classes/${classId}/feedback`,
      payload
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
