import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadSubmission, handleUploadError } from '../middlewares/upload.middleware';
import {
  getDashboard,
  getMyProfile,
  updateMyProfile,
  getMyClasses,
  getOpenClasses,
  getTransferTargetClasses,
  getClassDetails,
  enrollIntoClass,
  dropFromClass,
  getAssignments,
  getAttendance,
  getGrades,
  getSchedule,
  getCombinedSchedule,
  getPayments,
  getTuition,
  payTuition,
  getChangeRequests,
  createChangeRequest,
  cancelChangeRequest,
  submitAssignment,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/student.controller';
import {
  getMyClassFeedback,
  submitClassFeedback,
} from '../controllers/feedback.controller';

const router = Router();

// All routes require authentication and STUDENT role
router.use(authenticate);
router.use(authorize('STUDENT'));

// Aggregate
router.get('/dashboard', getDashboard);
router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);

// My classes
router.get('/classes', getMyClasses);
// Danh sách lớp đang MỞ để học viên tự ghi danh (M7)
router.get('/open-classes', getOpenClasses);
// Danh sách lớp ĐÍCH cho yêu cầu đổi lớp (gồm cả lớp đang chạy)
router.get('/transfer-target-classes', getTransferTargetClasses);
router.get('/classes/:id', getClassDetails);
// M7: self-enroll
router.post('/enrollments', enrollIntoClass);
// M7: self-drop (rút khỏi lớp)
router.delete('/enrollments/:enrollmentId', dropFromClass);
router.get('/classes/:id/assignments', getAssignments);
router.get('/classes/:id/attendance', getAttendance);
router.get('/classes/:id/grades', getGrades);
router.get('/classes/:id/schedule', getSchedule);

// Payments
router.get('/payments', getPayments);

// Tuition (học phí theo lớp) — M8
router.get('/tuition', getTuition);
router.post('/tuition/:enrollmentId/pay', payTuition);

// Combined schedule across all classes (M6) — declare BEFORE :id routes
router.get('/schedule/all', getCombinedSchedule);

// Change requests
router.get('/requests', getChangeRequests);
router.post('/requests', createChangeRequest);
router.delete('/requests/:id', cancelChangeRequest);

// Notifications (M4)
router.get('/notifications', getMyNotifications);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);
router.delete('/notifications/:id', deleteNotification);

// Submit assignment (supports multipart/form-data for file upload)
router.post(
  '/assignments/:id/submit',
  uploadSubmission.single('file'),
  handleUploadError,
  submitAssignment
);

// Phản hồi / đánh giá lớp học (học viên gửi & xem phản hồi của mình)
router.get('/classes/:id/feedback', getMyClassFeedback);
router.post('/classes/:id/feedback', submitClassFeedback);

export { router as studentRouter };
