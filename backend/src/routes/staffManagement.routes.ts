import { Router } from 'express';
import {
  getManagedStudentById,
  getManagedStudents,
  getManagedTeacherById,
  getManagedTeachers,
  getStudentManagementOptions,
  updateManagedAccountStatus,
} from '../controllers/staffManagement.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

export const staffManagementRouter = Router();
staffManagementRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

staffManagementRouter.get('/students/options', getStudentManagementOptions);
staffManagementRouter.get('/students', getManagedStudents);
staffManagementRouter.get('/students/:id', getManagedStudentById);
staffManagementRouter.get('/teachers', getManagedTeachers);
staffManagementRouter.get('/teachers/:id', getManagedTeacherById);
staffManagementRouter.patch('/accounts/:id/status', updateManagedAccountStatus);
