import { Router } from 'express';
import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// View Announcements (Public)
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Staff / Director create, update, delete announcement
router.post('/', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), createAnnouncement);
router.put('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('DIRECTOR', 'TRAINING_STAFF'), deleteAnnouncement);

export { router as announcementRouter };
