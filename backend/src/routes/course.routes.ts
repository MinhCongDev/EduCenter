import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// UC02: View Courses List, UC04: Search Courses, UC05: Filter Courses
router.get('/', getCourses);

// UC03: View Courses Detail
router.get('/:id', getCourseById);

// Staff / Director management routes
router.post('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), createCourse);
router.put('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), updateCourse);
router.delete('/:id', authenticate, authorize('DIRECTOR'), deleteCourse);

export { router as courseRouter };
