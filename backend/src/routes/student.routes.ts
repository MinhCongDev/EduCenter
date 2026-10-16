import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadSubmission, handleUploadError } from '../middlewares/upload.middleware';
import {
  getDashboard,
  getMyProfile,
  getMyClasses,
  getClassDetails,
  enrollIntoClass,
  getAssignments,
  getAttendance,
  getGrades,
  getSchedule,
  getCombinedSchedule,
  getPayments,
  getChangeRequests,
  createChangeRequest,
  cancelChangeRequest,
  submitAssignment,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/student.controller';

const router = Router();

// All routes require authentication and STUDENT role
router.use(authenticate);
router.use(authorize('STUDENT'));

// Aggregate
router.get('/dashboard', getDashboard);
router.get('/profile', getMyProfile);

// My classes
router.get('/classes', getMyClasses);
router.get('/classes/:id', getClassDetails);
// M7: self-enroll
router.post('/enrollments', enrollIntoClass);
router.get('/classes/:id/assignments', getAssignments);
router.get('/classes/:id/attendance', getAttendance);
router.get('/classes/:id/grades', getGrades);
router.get('/classes/:id/schedule', getSchedule);

// Payments
router.get('/payments', getPayments);

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

export { router as studentRouter };
