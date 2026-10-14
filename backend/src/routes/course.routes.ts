import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';

export const courseRouter = Router();

// Public: list & detail
courseRouter.get('/', getCourses);
courseRouter.get('/:id', getCourseById);

// Staff + Director: create / update / delete
courseRouter.post('/', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), createCourse);
courseRouter.put('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), updateCourse);
courseRouter.delete('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), deleteCourse);
