import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getMyPayments,
  getPendingTuition,
  processPayment,
  getPaymentReceipt,
} from '../controllers/payment.controller';

const router = Router();

// Tất cả các route thanh toán đều yêu cầu xác thực đăng nhập
router.use(authenticate);

// Lấy danh sách lịch sử thanh toán & thống kê tài chính
router.get('/my-payments', authorize('STUDENT'), getMyPayments);

// Lấy danh sách học phí còn nợ cần đóng
router.get('/pending-tuition', authorize('STUDENT'), getPendingTuition);

// Thực hiện giao dịch đóng học phí trực tuyến
router.post('/process', authorize('STUDENT'), processPayment);

// Xuất biên lai điện tử cho 1 thanh toán cụ thể
router.get('/:id/receipt', authorize('STUDENT', 'TRAINING_STAFF', 'DIRECTOR'), getPaymentReceipt);

export const paymentRouter = router;
