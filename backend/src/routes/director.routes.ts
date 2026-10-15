import { Router } from 'express';
import {
  getStaffList,
  addStaffAccount,
  monitorCenterOperations,
  monitorStudentActivities,
  monitorTeacherActivities,
  getStudentReports,
  getTeacherReports,
  getClassReports,
  getCourseReports,
  getRevenueReports,
} from '../controllers/director.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Director routes require authentication and DIRECTOR role
router.use(authenticate, authorize('DIRECTOR'));

// UC52: View Staff Accounts List
router.get('/staff-list', getStaffList);

// UC53: Add Staff Account
router.post('/staff-account', addStaffAccount);

// UC54: Monitor Center Operations
router.get('/operations', monitorCenterOperations);

// Monitor Student Activities
router.get('/student-activities', monitorStudentActivities);

// Monitor Teacher Activities
router.get('/teacher-activities', monitorTeacherActivities);

// UC56: View Student Reports
router.get('/reports/students', getStudentReports);

// UC57: View Teacher Reports
router.get('/reports/teachers', getTeacherReports);

// UC58: View Class Reports
router.get('/reports/classes', getClassReports);

// UC59: View Course Reports
router.get('/reports/courses', getCourseReports);

// UC60: View Revenue Reports (strictly calculated from database transactions!)
router.get('/reports/revenue', getRevenueReports);

export { router as directorRouter };
