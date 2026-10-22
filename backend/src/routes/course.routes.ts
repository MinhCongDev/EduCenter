import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';

const router = Router();

// View Courses List, Search Courses, Filter Courses
router.get('/', getCourses);

// View Courses Detail
router.get('/:id', getCourseById);

// Staff / Director management routes
router.post('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), createCourse);
router.put('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), updateCourse);
router.delete('/:id', authenticate, authorize('DIRECTOR'), deleteCourse);

export { router as courseRouter };
