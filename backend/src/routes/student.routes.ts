import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getMyClasses,
  getClassDetails,
  getAssignments,
  getAttendance,
  getGrades,
  getSchedule,
  getPayments,
  getChangeRequests,
  createChangeRequest,
  submitAssignment,
} from '../controllers/student.controller';

const router = Router();

// All routes require authentication and STUDENT role
router.use(authenticate);
router.use(authorize('STUDENT'));

// My classes
router.get('/classes', getMyClasses);
router.get('/classes/:id', getClassDetails);
router.get('/classes/:id/assignments', getAssignments);
router.get('/classes/:id/attendance', getAttendance);
router.get('/classes/:id/grades', getGrades);
router.get('/classes/:id/schedule', getSchedule);

// Payments
router.get('/payments', getPayments);

// Change requests
router.get('/requests', getChangeRequests);
router.post('/requests', createChangeRequest);

// Submit assignment
router.post('/assignments/:id/submit', submitAssignment);

export { router as studentRouter };
