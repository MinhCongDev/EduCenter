import { Router } from 'express';
import {
  getAssignedClasses,
  getClassStudents,
  getTeachingSchedule,
  getTeacherAssignments,
  createAssignment,
  getSubmissions,
  gradeSubmission,
  updateStudentGrade,
  createTeacherScheduleRequest,
  getTeacherChangeRequests,
  getClassAttendance,
  checkAttendance,
} from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All teacher routes require authentication
router.use(authenticate);

// UC25: View Assigned Classes
router.get('/classes', getAssignedClasses);

// UC26: View Student List & UC28: Student Info & UC29: Student Academic Results
router.get('/classes/:classId/students', getClassStudents);

// UC27: View Teaching Schedule
router.get('/schedule', getTeachingSchedule);

// UC30: View Assignments
router.get('/assignments', getTeacherAssignments);

// UC35: Create Assignment & UC36: Assign Assignment
router.post('/assignments', createAssignment);

// Submissions list
router.get('/assignments/:assignmentId/submissions', getSubmissions);

// UC31: Grade Assignments & UC32: Update Grades
router.post('/submissions/:submissionId/grade', gradeSubmission);

// UC32: Update student final/midterm grade on enrollment
router.put('/enrollments/:enrollmentId/grade', updateStudentGrade);

// UC33: Submit Schedule Change Request
router.post('/schedule-change-request', createTeacherScheduleRequest);

// UC34: Track Change Requests
router.get('/change-requests', getTeacherChangeRequests);

// UC37: View Attendance
router.get('/attendance/:classId', getClassAttendance);

// UC38: Check Attendance
router.post('/attendance', checkAttendance);

export { router as teacherRouter };
