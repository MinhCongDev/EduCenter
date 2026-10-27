import { Router, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models/user.model';
import { AuthRequest, authenticate } from '../middlewares/auth.middleware';
import {
  getPlacementTests,
  getPlacementTestById,
  submitPlacementTest,
  getMyTestHistory,
} from '../controllers/placementTest.controller';

export const placementTestRouter = Router();

// Optional authentication helper: extracts user if token provided, but doesn't block guests
const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await User.findById(decoded.id);
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore invalid token for optional auth
  }
  next();
};

/**
 * @route   GET /api/placement-tests
 * @desc    List all 3 placement tests
 * @access  Public
 */
placementTestRouter.get('/', getPlacementTests);

/**
 * @route   GET /api/placement-tests/my/history
 * @desc    Get user's past test history
 * @access  Private
 */
placementTestRouter.get('/my/history', authenticate, getMyTestHistory);

/**
 * @route   GET /api/placement-tests/:id
 * @desc    Get test paper details (questions & passages)
 * @access  Public
 */
placementTestRouter.get('/:id', getPlacementTestById);

/**
 * @route   POST /api/placement-tests/:id/submit
 * @desc    Submit answers and receive evaluated score & course recommendations
 * @access  Public (Guest or Logged in)
 */
placementTestRouter.post('/:id/submit', optionalAuthenticate, submitPlacementTest);
