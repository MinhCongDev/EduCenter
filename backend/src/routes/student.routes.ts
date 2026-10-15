import { Router } from 'express';
import {
  getAssignedClasses,
  getWeeklySchedule,
  getStudentAssignments,
  submitAssignment,
  getAcademicResults,
  createChangeRequest,
  getChangeRequests,
  getStudentAttendance,
  submitFeedback,
  getRegistrations,
  makePayment,
} from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';


const router = Router();

// All student routes require authentication and STUDENT role (or STAFF/DIRECTOR for preview)
router.use(authenticate);

// UC14, UC16, UC17: View Assigned Class & Information & Teacher Info
router.get('/classes', getAssignedClasses);

// UC15: View Weekly Schedule
router.get('/schedule', getWeeklySchedule);

// UC18: View Assignments
router.get('/assignments', getStudentAssignments);

// UC19: Do Assignments (Submit)
router.post('/assignments/:id/submit', submitAssignment);

// UC20: View Grades and Academic Results
router.get('/academic-results', getAcademicResults);

// UC21, UC22: Request to change class / Schedule
router.post('/change-requests', createChangeRequest);

// UC24: Track Change Requests
router.get('/change-requests', getChangeRequests);

// UC23: View attendance
router.get('/attendance', getStudentAttendance);

// Teacher Feedback
router.post('/feedback', submitFeedback);

// UC13: View Registration Status
router.get('/registrations', getRegistrations);

// UC12: Make Payment
router.post('/payments', makePayment);

export { router as studentRouter };
