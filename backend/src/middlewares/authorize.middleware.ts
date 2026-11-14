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

    const userRole = req.user.role;
    // ADMIN has all permissions of DIRECTOR and TRAINING_STAFF
    const effectiveRoles: string[] = [...roles];
    if (roles.includes('DIRECTOR') || roles.includes('TRAINING_STAFF')) {
      if (!effectiveRoles.includes('ADMIN')) {
        effectiveRoles.push('ADMIN');
      }
    }

    if (!effectiveRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
      });
      return;
    }

    next();
  };
};
