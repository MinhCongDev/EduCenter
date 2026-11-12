import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getAssignedClasses,
  getClassDetail,
  getStudentList,
  getStudentDetail,
  getTeachingSchedule,
  getStudentAcademicResults,
  createOrEnterGrade,
  updateGrade,
  deleteGrade,
  submitScheduleChangeRequest,
  getScheduleChangeRequests,
  getAttendance,
  checkAttendance,
} from '../controllers/teacher.controller';

const router = Router();

// All routes require TEACHER (or DIRECTOR / TRAINING_STAFF) role
router.use(authenticate, authorize('TEACHER', 'DIRECTOR', 'TRAINING_STAFF'));

// 1. Class Management
router.get('/classes', getAssignedClasses);
router.get('/classes/:classId', getClassDetail);

// 2. Student Management & Information
router.get('/students', getStudentList);
router.get('/students/:studentId', getStudentDetail);

// 3. Teaching Schedule (Timetable)
router.get('/schedule', getTeachingSchedule);

// 4. Periodic Tests & General Evaluations (Monthly / Course)
router.get('/grades', getStudentAcademicResults);
router.post('/grades', createOrEnterGrade);
router.put('/grades/:gradeId', updateGrade);
router.delete('/grades/:gradeId', deleteGrade);

// 5. Schedule Change Requests & Tracking
router.post('/schedule-requests', submitScheduleChangeRequest);
router.get('/schedule-requests', getScheduleChangeRequests);

// 6. Session Attendance (View & Check)
router.get('/attendance', getAttendance);
router.post('/attendance', checkAttendance);

export { router as teacherRouter };
