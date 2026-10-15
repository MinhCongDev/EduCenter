import { Router } from 'express';
import {
  getCourses,
  createCourse,
  updateCourse,
  getStudents,
  updateStudent,
  getTeachers,
  updateTeacher,
  getClasses,
  createClass,
  updateClass,
  assignStudentToClass,
  assignTeacherToClass,
  getClassSchedules,
  createClassSchedule,
  getRegistrations,
  getPayments,
  confirmPayment,
  getChangeRequests,
  processChangeRequest,
  getAcademicResults,
  getFinalExams,
  createFinalExam,
} from '../controllers/staff.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Staff routes require authentication and TRAINING_STAFF or DIRECTOR role
router.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

// UC39: Manage Courses and Training Programs
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);

// UC40: Manage Student Accounts
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);

// UC41: Manage Teacher Accounts
router.get('/teachers', getTeachers);
router.put('/teachers/:id', updateTeacher);

// UC42: Manage Classes
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);

// UC43: Assign Students to Classes
router.post('/classes/:classId/assign-student', assignStudentToClass);

// UC44: Assign Teachers to Classes
router.post('/classes/:classId/assign-teacher', assignTeacherToClass);

// UC45: Manage Class Schedules
router.get('/schedules', getClassSchedules);
router.post('/schedules', createClassSchedule);

// UC46: Track Registrations
router.get('/registrations', getRegistrations);

// UC47: Track Payments
router.get('/payments', getPayments);
router.put('/payments/:id/confirm', confirmPayment);

// UC48 & UC49: Process Class and Schedule Change Requests
router.get('/change-requests', getChangeRequests);
router.put('/change-requests/:id', processChangeRequest);

// UC50 & UC51: Track and View Academic Results
router.get('/academic-results', getAcademicResults);

// Final Exam Management
router.get('/final-exams', getFinalExams);
router.post('/final-exams', createFinalExam);

export { router as staffRouter };
