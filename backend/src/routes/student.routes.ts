import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  getEnrollmentStatus,
  getMyClasses,
  getClassDetails,
  getClassTeachers,
  getWeeklySchedule,
  getAssignments,
  submitAssignment,
  getGrades,
  getAttendance,
  makePayment,
  requestClassChange,
  requestScheduleChange,
  getMyRequests
} from '../controllers/student.controller';

const router = Router();

// Tất cả routes đều cần đăng nhập và có role STUDENT
router.use(authenticate);
router.use(authorize('STUDENT'));

// UC #14: Xem trạng thái đăng ký
router.get('/enrollments/status', getEnrollmentStatus);

// UC #15: Xem danh sách lớp đã đăng ký
router.get('/classes', getMyClasses);

// UC #17: Xem thông tin lớp học
router.get('/classes/:classId', getClassDetails);

// UC #18: Xem thông tin giảng viên
router.get('/classes/:classId/teachers', getClassTeachers);

// UC #16: Xem thời khóa biểu tuần
router.get('/classes/:classId/schedule', getWeeklySchedule);

// UC #19: Xem danh sách bài tập
router.get('/classes/:classId/assignments', getAssignments);

// UC #21: Xem điểm
router.get('/classes/:classId/grades', getGrades);

// UC #24: Xem điểm danh
router.get('/classes/:classId/attendance', getAttendance);

// UC #20: Nộp bài tập
router.post('/assignments/submit', submitAssignment);

// UC #13: Thanh toán học phí
router.post('/payments', makePayment);

// UC #22: Yêu cầu đổi lớp
router.post('/requests/class-change', requestClassChange);

// UC #23: Yêu cầu đổi lịch học
router.post('/requests/schedule-change', requestScheduleChange);

// UC #25: Theo dõi yêu cầu thay đổi
router.get('/requests', getMyRequests);

export { router as studentRouter };
