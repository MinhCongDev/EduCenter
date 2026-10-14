import api from './api';
import type {
  ApiResponse,
  Enrollment,
  MyClass,
  Class,
  ClassSchedule,
  Assignment,
  Submission,
  Grade,
  Attendance,
  AttendanceStats,
  Payment,
  ChangeRequest,
} from '../types';

// ============================================
// STUDENT API SERVICE
// ============================================

export const studentService = {
  // ============================================
  // UC #14: Xem trạng thái đăng ký học
  // ============================================
  getEnrollmentStatus: async (): Promise<ApiResponse<{ enrollments: Enrollment[] }>> => {
    const response = await api.get('/student/enrollments/status');
    return response.data;
  },

  // ============================================
  // UC #15: Xem danh sách lớp đã đăng ký
  // ============================================
  getMyClasses: async (): Promise<ApiResponse<{ classes: MyClass[] }>> => {
    const response = await api.get('/student/classes');
    return response.data;
  },

  // ============================================
  // UC #17: Xem thông tin lớp học
  // ============================================
  getClassDetails: async (classId: string): Promise<ApiResponse<{ class: Class; enrollmentStatus: string; tuitionStatus: string }>> => {
    const response = await api.get(`/student/classes/${classId}`);
    return response.data;
  },

  // ============================================
  // UC #18: Xem thông tin giảng viên
  // ============================================
  getClassTeachers: async (classId: string): Promise<ApiResponse<{ teacher: any; class: any }>> => {
    const response = await api.get(`/student/classes/${classId}/teachers`);
    return response.data;
  },

  // ============================================
  // UC #16: Xem thời khóa biểu tuần
  // ============================================
  getWeeklySchedule: async (classId: string): Promise<ApiResponse<{ schedules: ClassSchedule[] }>> => {
    const response = await api.get(`/student/classes/${classId}/schedule`);
    return response.data;
  },

  // ============================================
  // UC #19: Xem danh sách bài tập
  // ============================================
  getAssignments: async (classId: string): Promise<ApiResponse<{ assignments: Assignment[] }>> => {
    const response = await api.get(`/student/classes/${classId}/assignments`);
    return response.data;
  },

  // ============================================
  // UC #20: Nộp bài tập
  // ============================================
  submitAssignment: async (data: {
    assignmentId: string;
    content: string;
    attachmentUrl?: string;
  }): Promise<ApiResponse<{ submission: Submission }>> => {
    const response = await api.post('/student/assignments/submit', data);
    return response.data;
  },

  // ============================================
  // UC #21: Xem điểm
  // ============================================
  getGrades: async (classId: string): Promise<ApiResponse<{ grades: Grade[] }>> => {
    const response = await api.get(`/student/classes/${classId}/grades`);
    return response.data;
  },

  // ============================================
  // UC #24: Xem điểm danh
  // ============================================
  getAttendance: async (classId: string): Promise<ApiResponse<{ attendance: Attendance[]; stats: AttendanceStats }>> => {
    const response = await api.get(`/student/classes/${classId}/attendance`);
    return response.data;
  },

  // ============================================
  // UC #13: Thanh toán học phí
  // ============================================
  makePayment: async (data: {
    enrollmentId: string;
    amount: number;
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'VNPAY' | 'MOMO';
    transactionCode?: string;
  }): Promise<ApiResponse<{ payment: Payment }>> => {
    const response = await api.post('/student/payments', data);
    return response.data;
  },

  // ============================================
  // UC #22: Yêu cầu đổi lớp
  // ============================================
  requestClassChange: async (data: {
    currentClassId: string;
    targetClassId: string;
    reason: string;
  }): Promise<ApiResponse<{ changeRequest: ChangeRequest }>> => {
    const response = await api.post('/student/requests/class-change', data);
    return response.data;
  },

  // ============================================
  // UC #23: Yêu cầu đổi lịch học
  // ============================================
  requestScheduleChange: async (data: {
    currentScheduleId: string;
    targetScheduleId: string;
    reason: string;
  }): Promise<ApiResponse<{ changeRequest: ChangeRequest }>> => {
    const response = await api.post('/student/requests/schedule-change', data);
    return response.data;
  },

  // ============================================
  // UC #25: Theo dõi yêu cầu thay đổi
  // ============================================
  getMyRequests: async (): Promise<ApiResponse<{ requests: ChangeRequest[] }>> => {
    const response = await api.get('/student/requests');
    return response.data;
  },
};
