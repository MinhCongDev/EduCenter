import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getDashboardStats,
  getApprovals,
  reviewApproval,
  createProposal,
  getStaffAccountsList,
  addStaffAccount,
  updateStaffStatus,
  updateUserRole,
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

// 1. Dashboard Overview Stats & Approvals
router.get('/dashboard-stats', getDashboardStats);
router.get('/approvals', getApprovals);
router.post('/approvals', createProposal);
router.patch('/approvals/:id/review', reviewApproval);

// 2. All User Accounts & Permissions Management
router.get('/staff', getStaffAccountsList);
router.post('/staff', addStaffAccount);
router.patch('/staff/:id/status', updateStaffStatus);
router.patch('/staff/:id/role', updateUserRole);

// Alias routes for clarity
router.get('/users', getStaffAccountsList);
router.post('/users', addStaffAccount);
router.patch('/users/:id/status', updateStaffStatus);
router.patch('/users/:id/role', updateUserRole);

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
