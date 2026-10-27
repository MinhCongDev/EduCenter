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

// Public / Student / Staff: Xem danh sách bài test từ CSDL và làm bài
placementTestRouter.get('/', optionalAuthenticate, getPlacementTests);
placementTestRouter.get('/:id', optionalAuthenticate, getPlacementTestById);
placementTestRouter.post('/:id/submit', optionalAuthenticate, submitPlacementTest);

// Staff / Director: Quản trị, tạo mới, cập nhật, xóa bài test trong CSDL
placementTestRouter.post('/', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), createPlacementTest);
placementTestRouter.put('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), updatePlacementTest);
placementTestRouter.delete('/:id', authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'), deletePlacementTest);
