import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import {
  createClass,
  deleteClass,
  getClassById,
  getClasses,
  getClassOptions,
  updateClass,
} from '../controllers/class.controller';

export const classRouter = Router();
classRouter.use(authenticate, authorize('TRAINING_STAFF', 'DIRECTOR'));

classRouter.get('/options', getClassOptions);
classRouter.get('/', getClasses);
classRouter.get('/:id', getClassById);
classRouter.post('/', createClass);
classRouter.put('/:id', updateClass);
classRouter.delete('/:id', deleteClass);
