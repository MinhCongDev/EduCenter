import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  getClassScheduleById,
  getScheduleOptions,
  getWeeklySchedule,
  updateClassSchedule,
} from '../controllers/classSchedule.controller';

export const classScheduleRouter = Router();
classScheduleRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

classScheduleRouter.get('/options', getScheduleOptions);
classScheduleRouter.get('/week', getWeeklySchedule);
classScheduleRouter.get('/:id', getClassScheduleById);
classScheduleRouter.put('/:id', updateClassSchedule);
