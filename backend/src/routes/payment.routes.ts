import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getMyPayments,
  getPendingTuition,
  processPayment,
  getPaymentReceipt,
  createPayment,
  confirmPayment,
} from '../controllers/payment.controller';

const router = Router();

// Tất cả các route thanh toán đều yêu cầu xác thực đăng nhập
router.use(authenticate);

// Lấy danh sách lịch sử thanh toán & thống kê tài chính
router.get('/my-payments', authorize('STUDENT'), getMyPayments);

// Lấy danh sách học phí còn nợ cần đóng
router.get('/pending-tuition', authorize('STUDENT'), getPendingTuition);

// Tạo mới bản ghi thanh toán ở trạng thái PENDING khi học viên mở mã QR
router.post('/', authorize('STUDENT', 'TRAINING_STAFF', 'DIRECTOR'), createPayment);

// Cập nhật trạng thái giao dịch từ pending sang success khi xác nhận đã chuyển khoản
router.put('/:id/confirm', authorize('STUDENT', 'TRAINING_STAFF', 'DIRECTOR'), confirmPayment);
router.post('/:id/confirm', authorize('STUDENT', 'TRAINING_STAFF', 'DIRECTOR'), confirmPayment); // Hỗ trợ cả method POST

// Thực hiện giao dịch đóng học phí trực tuyến (endpoint xử lý nhanh)
router.post('/process', authorize('STUDENT'), processPayment);

// Xuất biên lai điện tử cho 1 thanh toán cụ thể
router.get('/:id/receipt', authorize('STUDENT', 'TRAINING_STAFF', 'DIRECTOR'), getPaymentReceipt);

export const paymentRouter = router;

