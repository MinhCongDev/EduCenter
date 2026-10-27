import { Router } from 'express';
import { getCenterInfo, updateCenterInfo } from '../controllers/center.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// View Center Information (Public)
router.get('/', getCenterInfo);

// Update Center Information (Director/Staff)
router.put('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), updateCenterInfo);

export { router as centerRouter };
