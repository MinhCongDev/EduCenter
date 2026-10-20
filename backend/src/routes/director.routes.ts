import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getDashboardStats,
  getStaffAccountsList,
  addStaffAccount,
  updateStaffStatus,
  getCenterOperationsMonitoring,
  getStudentActivitiesMonitoring,
  getTeacherActivitiesMonitoring,
  getStudentReports,
  getTeacherReports,
  getClassAndCourseReports,
  getRevenueReports,
} from '../controllers/director.controller';

const router = Router();

// Only DIRECTOR (and optionally master admin) can access director routes
router.use(authenticate, authorize('DIRECTOR'));

// 1. Dashboard Overview Stats
router.get('/dashboard-stats', getDashboardStats);

// 2. Staff Accounts Management (View list, Add account, Update status)
router.get('/staff', getStaffAccountsList);
router.post('/staff', addStaffAccount);
router.patch('/staff/:id/status', updateStaffStatus);

// 3. Center Operations & Activities Monitoring
router.get('/monitoring/operations', getCenterOperationsMonitoring);
router.get('/monitoring/students', getStudentActivitiesMonitoring);
router.get('/monitoring/teachers', getTeacherActivitiesMonitoring);

// 4. Detailed Reports & Analytics
router.get('/reports/students', getStudentReports);
router.get('/reports/teachers', getTeacherReports);
router.get('/reports/classes', getClassAndCourseReports);
router.get('/reports/revenue', getRevenueReports);

export { router as directorRouter };
