import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  createPlacementTest,
  deletePlacementTest,
  getPlacementTestById,
  getPlacementTests,
  submitPlacementTest,
  updatePlacementTest,
} from '../controllers/placementTest.controller';

export const placementTestRouter = Router();

// Public: Xem danh sách bài test từ CSDL
placementTestRouter.get('/', optionalAuthenticate, getPlacementTests);

// Student / Staff / Director: Phải đăng nhập mới được xem chi tiết câu hỏi và làm bài thi thử
placementTestRouter.get('/:id', authenticate, getPlacementTestById);
placementTestRouter.post('/:id/submit', authenticate, submitPlacementTest);

// Staff / Director: Quản trị, tạo mới, cập nhật, xóa bài test trong CSDL
placementTestRouter.post('/', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), createPlacementTest);
placementTestRouter.put('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), updatePlacementTest);
placementTestRouter.delete('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), deletePlacementTest);
