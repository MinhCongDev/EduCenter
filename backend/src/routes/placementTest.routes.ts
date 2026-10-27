import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  createPlacementTest,
  deletePlacementTest,
  getPlacementTests,
  updatePlacementTest,
} from '../controllers/placementTest.controller';

export const placementTestRouter = Router();
placementTestRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));
placementTestRouter.get('/', getPlacementTests);
placementTestRouter.post('/', createPlacementTest);
placementTestRouter.put('/:id', updatePlacementTest);
placementTestRouter.delete('/:id', deletePlacementTest);
