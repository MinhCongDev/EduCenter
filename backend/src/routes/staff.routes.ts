import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getStaffRequests,
  reviewChangeRequest,
  getStaffNotifications,
  markStaffNotificationAsRead,
  markAllStaffNotificationsAsRead,
  deleteStaffNotification,
} from '../controllers/staff.controller';
import {
  getAllFeedback,
  getClassFeedbackSummary,
} from '../controllers/feedback.controller';

const router = Router();

// Phòng giáo vụ (và Ban giám đốc) xử lý yêu cầu thay đổi của học viên.
router.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

// ── Yêu cầu thay đổi ──
router.get('/requests', getStaffRequests);
router.patch('/requests/:id/review', reviewChangeRequest);

// ── Thông báo ──
router.get('/notifications', getStaffNotifications);
router.patch('/notifications/read-all', markAllStaffNotificationsAsRead);
router.patch('/notifications/:id/read', markStaffNotificationAsRead);
router.delete('/notifications/:id', deleteStaffNotification);

// ── Phản hồi / đánh giá của học viên ──
router.get('/feedback', getAllFeedback);
router.get('/feedback/:classId/summary', getClassFeedbackSummary);

export { router as staffRouter };
