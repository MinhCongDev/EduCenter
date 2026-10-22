import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  assignEnrollmentClass,
  getEnrollmentById,
  getEnrollmentOptions,
  getEnrollments,
} from '../controllers/enrollment.controller';

export const enrollmentRouter = Router();
enrollmentRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));
enrollmentRouter.get('/options', getEnrollmentOptions);
enrollmentRouter.get('/', getEnrollments);
enrollmentRouter.patch('/:id/class', assignEnrollmentClass);
enrollmentRouter.get('/:id', getEnrollmentById);
