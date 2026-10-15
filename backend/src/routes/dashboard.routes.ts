import { Router } from 'express';
import {
  getDirectorDashboard,
  getTeacherDashboard,
  getStaffDashboard,
  getStudentDashboard,
} from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

export const dashboardRouter: Router = Router();

// Director Dashboard
dashboardRouter.get('/director', authenticate, authorize('DIRECTOR'), getDirectorDashboard);

// Teacher Dashboard
dashboardRouter.get('/teacher', authenticate, authorize('TEACHER', 'DIRECTOR'), getTeacherDashboard);

// Training Staff Dashboard
dashboardRouter.get('/staff', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), getStaffDashboard);

// Student Dashboard
dashboardRouter.get('/student', authenticate, authorize('STUDENT', 'DIRECTOR'), getStudentDashboard);

export default dashboardRouter;
