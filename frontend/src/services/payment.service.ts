import api from './api';
import type {
  Payment,
  PaymentSummary,
  PendingTuitionItem,
  PaymentReceiptData,
  PaymentMethod,
  ApiResponse,
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
};
