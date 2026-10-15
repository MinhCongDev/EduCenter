import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Role-based authorization middleware.
 * Must be used AFTER `authenticate`.
 * Usage: authorize('TRAINING_STAFF', 'DIRECTOR')
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
      });
      return;
    }

    next();
  };
};
