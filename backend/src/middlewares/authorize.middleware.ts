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

    const userRole = req.user.role as string;
    const isAllowed =
      roles.includes(userRole) ||
      (userRole === 'ADMIN' && (roles.includes('DIRECTOR') || roles.includes('ADMIN') || roles.includes('TRAINING_STAFF')));

    if (!isAllowed) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
      });
      return;
    }

    next();
  };
};
