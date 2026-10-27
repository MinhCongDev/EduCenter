import api from './api';
import type {
  ApiResponse,
  ChangeRequest,
  ChangeRequestStatus,
  ClassFeedback,
  NotificationItem,
  RequestType,
} from '../types';

/**
 * Service cho Phòng Giáo vụ (TRAINING_STAFF) và Ban Giám đốc.
 *
 * Phạm vi chính:
 *  - Duyệt / từ chối yêu cầu thay đổi của học viên.
 *  - Xem phản hồi / đánh giá của học viên.
 *  - Đọc thông báo cá nhân.
 */
export const staffService = {
  // ---------------- Yêu cầu thay đổi ----------------
  /**
   * GET /api/staff/requests
   * Danh sách yêu cầu từ học viên / giảng viên đang chờ xử lý.
   */
  getRequests: async (params?: {
    status?: ChangeRequestStatus | 'ALL';
    requestType?: RequestType | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{ requests: ChangeRequest[] }> & {
      pagination?: { total: number; page: number; limit: number; totalPages: number };
    }
  > => {
    const res = await api.get<
      ApiResponse<{ requests: ChangeRequest[] }> & {
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      }
    >('/staff/requests', { params });
    return res.data;
  },

  /**
   * PATCH /api/staff/requests/:id/review
   * Duyệt hoặc từ chối yêu cầu.
   *
   * Khi duyệt yêu cầu đổi lớp, backend tự chuyển enrollment của học viên
   * sang lớp đích và cập nhật sĩ số hai lớp.
   */
  reviewRequest: async (
    id: string,
    payload: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }
  ): Promise<ApiResponse<{ request: ChangeRequest; enrollmentMoved: boolean }>> => {
    const res = await api.patch<ApiResponse<{ request: ChangeRequest; enrollmentMoved: boolean }>>(
      `/staff/requests/${id}/review`,
      payload
    );
    return res.data;
  },

  // ---------------- Phản hồi học viên ----------------
  /** GET /api/staff/feedback */
  getFeedback: async (params?: {
    classId?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{ items: ClassFeedback[] }> & {
      pagination?: { total: number; page: number; limit: number; totalPages: number };
      stats?: {
        total: number;
        avgRating: number;
        byClass: { classId: string; avgRating: number; count: number }[];
      };
    }
  > => {
    const res = await api.get<
      ApiResponse<{ items: ClassFeedback[] }> & {
        pagination?: { total: number; page: number; limit: number; totalPages: number };
        stats?: {
          total: number;
          avgRating: number;
          byClass: { classId: string; avgRating: number; count: number }[];
        };
      }
    >('/staff/feedback', { params });
    return res.data;
  },

  /** GET /api/staff/feedback/:classId/summary */
  getClassFeedbackSummary: async (
    classId: string
  ): Promise<
    ApiResponse<{
      class: { _id: string; classCode: string };
      avgRating: number;
      count: number;
      distribution: { star: number; count: number }[];
    }>
  > => {
    const res = await api.get<
      ApiResponse<{
        class: { _id: string; classCode: string };
        avgRating: number;
        count: number;
        distribution: { star: number; count: number }[];
      }>
    >(`/staff/feedback/${classId}/summary`);
    return res.data;
  },

  // ---------------- Thông báo ----------------
  /** GET /api/staff/notifications */
  getMyNotifications: async (
    limit?: number
  ): Promise<ApiResponse<{ items: NotificationItem[]; unreadCount: number }>> => {
    const res = await api.get<ApiResponse<{ items: NotificationItem[]; unreadCount: number }>>(
      '/staff/notifications',
      { params: limit ? { limit } : undefined }
    );
    return res.data;
  },

  /** PATCH /api/staff/notifications/:id/read */
  markNotificationAsRead: async (id: string): Promise<ApiResponse> => {
    const res = await api.patch<ApiResponse>(`/staff/notifications/${id}/read`);
    return res.data;
  },

  /** PATCH /api/staff/notifications/read-all */
  markAllNotificationsAsRead: async (): Promise<ApiResponse<{ modified: number }>> => {
    const res = await api.patch<ApiResponse<{ modified: number }>>(
      '/staff/notifications/read-all'
    );
    return res.data;
  },

  /** DELETE /api/staff/notifications/:id */
  deleteNotification: async (id: string): Promise<ApiResponse> => {
    const res = await api.delete<ApiResponse>(`/staff/notifications/${id}`);
    return res.data;
  },
};

export default staffService;
