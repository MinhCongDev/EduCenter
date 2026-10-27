import { Router } from 'express';
import {
  getManagedStudentById,
  getManagedStudents,
  getManagedTeacherById,
  getManagedTeachers,
  getStudentManagementOptions,
  updateManagedAccountStatus,
  updateStudentPlacement,
} from '../controllers/staffManagement.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';

export const staffManagementRouter = Router();
staffManagementRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

staffManagementRouter.get('/students/options', getStudentManagementOptions);
staffManagementRouter.get('/students', getManagedStudents);
staffManagementRouter.get('/students/:id', getManagedStudentById);
staffManagementRouter.patch('/students/:id/placement', updateStudentPlacement);
staffManagementRouter.get('/teachers', getManagedTeachers);
staffManagementRouter.get('/teachers/:id', getManagedTeacherById);
staffManagementRouter.patch('/accounts/:id/status', updateManagedAccountStatus);

