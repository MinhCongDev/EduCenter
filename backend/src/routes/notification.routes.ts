import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// View Notifications
router.get('/', getNotifications);

// Mark as read
router.put('/:id/read', markNotificationRead);

// Mark all as read
router.put('/read-all', markAllNotificationsRead);

export { router as notificationRouter };
