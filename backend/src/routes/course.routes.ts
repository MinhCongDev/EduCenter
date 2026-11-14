import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadCourseImage, handleUploadError } from '../middlewares/upload.middleware';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseImageHandler,
} from '../controllers/course.controller';

const router = Router();

// View Courses List, Search Courses, Filter Courses
router.get('/', getCourses);

// View Courses Detail
router.get('/:id', getCourseById);

// Staff / Director management routes
router.post(
  '/upload-image',
  authenticate,
  authorize('DIRECTOR', 'TRAINING_STAFF'),
  uploadCourseImage.single('image'),
  handleUploadError,
  uploadCourseImageHandler
);
router.post('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), createCourse);
router.put('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), updateCourse);
router.delete('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), deleteCourse);

export { router as courseRouter };
