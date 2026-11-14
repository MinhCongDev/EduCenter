import api from './api';
import type {
  Payment,
  PaymentSummary,
  PendingTuitionItem,
  PaymentReceiptData,
  PaymentMethod,
  ApiResponse,
  PayOSPaymentLinkResult,
  PayOSStatusCheckResult,
} from '../types';

export interface GetPaymentsParams {
  status?: string;
  search?: string;
}

export interface ProcessPaymentPayload {
  enrollmentId: string;
  method: PaymentMethod;
  note?: string;
}

export interface CreatePaymentPayload {
  studentId?: string;
  amount: number;
  courseId?: string;
  invoiceId?: string;
  enrollmentId?: string;
  paymentMethod?: PaymentMethod;
  method?: PaymentMethod;
  note?: string;
  transactionCode?: string;
}

export interface ConfirmPaymentPayload {
  paymentMethod?: PaymentMethod;
  method?: PaymentMethod;
  note?: string;
  transactionCode?: string;
}

export interface CreatePayOSLinkPayload {
  courseId?: string;
  enrollmentId?: string;
  amount?: number;
  description?: string;
}

export const paymentService = {
  /**
   * Lấy lịch sử giao dịch và tóm tắt tài chính của học viên
   */
  getMyPayments: async (params?: GetPaymentsParams): Promise<{ payments: Payment[]; summary: PaymentSummary }> => {
    const response = await api.get<ApiResponse<{ payments: Payment[]; summary: PaymentSummary }>>(
      '/payments/my-payments',
      { params }
    );
    return response.data.data || {
      payments: [],
      summary: {
        totalPaid: 0,
        successCount: 0,
        pendingCount: 0,
        pendingTuitionCount: 0,
        totalPendingTuitionAmount: 0,
      },
    };
  },

  /**
   * Lấy danh sách các khóa học đã ghi danh nhưng chưa thanh toán học phí
   */
  getPendingTuition: async (): Promise<PendingTuitionItem[]> => {
    const response = await api.get<ApiResponse<PendingTuitionItem[]>>('/payments/pending-tuition');
    return response.data.data || [];
  },

  /**
   * Tạo bản ghi thanh toán ở trạng thái PENDING khi mở mã QR
   * POST /api/payments
   */
  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>('/payments', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Không thể khởi tạo giao dịch thanh toán');
    }
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái giao dịch từ PENDING sang SUCCESS khi học viên xác nhận đã chuyển khoản
   * PUT /api/payments/:id/confirm
   */
  confirmPayment: async (paymentId: string, payload?: ConfirmPaymentPayload): Promise<Payment> => {
    const response = await api.put<ApiResponse<Payment>>(`/payments/${paymentId}/confirm`, payload || {});
    if (!response.data.data) {
      throw new Error(response.data.message || 'Xác nhận thanh toán không thành công');
    }
    return response.data.data;
  },

  /**
   * Thực hiện thanh toán học phí trực tuyến
   */
  processPayment: async (payload: ProcessPaymentPayload): Promise<Payment> => {
    const response = await api.post<ApiResponse<Payment>>('/payments/process', payload);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Thanh toán không thành công');
    }
    return response.data.data;
  },

  /**
   * Lấy chi tiết biên lai hóa đơn điện tử
   */
  getPaymentReceipt: async (paymentId: string): Promise<PaymentReceiptData> => {
    const response = await api.get<ApiResponse<PaymentReceiptData>>(`/payments/${paymentId}/receipt`);
    if (!response.data.data) {
      throw new Error(response.data.message || 'Không thể lấy thông tin biên lai');
    }
    return response.data.data;
  },

  /**
   * Kiểm tra xem cấu hình PayOS (Client ID, API Key, Checksum Key) đã sẵn sàng chưa
   * GET /api/payments/payos/config-status
   */
  getPayOSConfigStatus: async (): Promise<{ isConfigured: boolean }> => {
    const response = await api.get<ApiResponse<{ isConfigured: boolean }>>('/payments/payos/config-status');
    return response.data.data || { isConfigured: false };
  },

  /**
   * Tạo liên kết thanh toán PayOS và mã QR chuyên nghiệp
   * POST /api/payments/payos/create-link
   */
  createPayOSPaymentLink: async (
    payload: CreatePayOSLinkPayload
  ): Promise<{ payment: Payment; payos: PayOSPaymentLinkResult }> => {
    const response = await api.post<ApiResponse<{ payment: Payment; payos: PayOSPaymentLinkResult }>>(
      '/payments/payos/create-link',
      payload
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Không thể tạo liên kết thanh toán PayOS');
    }
    return response.data.data;
  },

  /**
   * Đối chiếu mã thanh toán của hệ thống với PayOS
   * GET /api/payments/payos/check-status/:orderCode
   */
  checkPayOSStatus: async (orderCode: number | string): Promise<PayOSStatusCheckResult> => {
    const response = await api.get<ApiResponse<PayOSStatusCheckResult>>(
      `/payments/payos/check-status/${orderCode}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || 'Không thể đối chiếu trạng thái thanh toán từ PayOS');
    }
    return response.data.data;
  },

  /**
   * Hủy đơn thanh toán và tự động hủy đăng ký khóa học khi hết thời gian 10 phút
   * POST /api/payments/cancel-expired
   */
  cancelExpiredPayment: async (payload: {
    orderCode?: number | null;
    paymentId?: string;
    enrollmentId?: string;
    courseId?: string;
    reason?: string;
  }): Promise<any> => {
    const response = await api.post<ApiResponse<any>>('/payments/cancel-expired', payload);
    return response.data;
  },
};

