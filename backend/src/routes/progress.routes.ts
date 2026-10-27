import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  getClassProgress,
  markStudentMilestone,
  getMyProgress,
  updateCourseMilestones,
} from '../controllers/progress.controller';

export const progressRouter = Router();

progressRouter.use(authenticate);

// 1. Học viên xem tiến độ học tập của các lớp mình đang tham gia
progressRouter.get('/my-progress', authorize('STUDENT'), getMyProgress);

// 2. Giáo viên, Giáo vụ, Giám đốc xem tiến độ học tập của toàn bộ học viên trong 1 lớp
progressRouter.get('/class/:classId', authorize('TEACHER', 'TRAINING_STAFF', 'DIRECTOR'), getClassProgress);

// 3. Đánh dấu hoàn thành hoặc hủy mốc tiến độ cho học viên
progressRouter.post('/mark', authorize('TEACHER', 'TRAINING_STAFF', 'DIRECTOR'), markStudentMilestone);

// 4. Quản lý danh mục các mốc tiến độ của khóa học (Giáo vụ / Giám đốc)
progressRouter.put('/course/:courseId/milestones', authorize('TRAINING_STAFF', 'DIRECTOR'), updateCourseMilestones);
