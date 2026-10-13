import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
} from '../controllers/announcement.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// UC06: View Announcements (Public)
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Staff / Director create announcement
router.post('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), createAnnouncement);

export { router as announcementRouter };
