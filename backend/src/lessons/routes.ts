import { Router } from 'express';
import {
  getLessonsByCourse,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
} from './controller';
import { authenticate, authorize } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(generalRateLimiter);

// GET /course/:courseId - Get lessons for a course (authenticated)
router.get('/course/:courseId', authenticate, getLessonsByCourse);

// GET /:id - Get lesson details (authenticated)
router.get('/:id', authenticate, getLessonById);

// POST / - Create new lesson (admin only)
router.post('/', authenticate, authorize('ADMIN'), createLesson);

// PUT /:id - Update lesson (admin only)
router.put('/:id', authenticate, authorize('ADMIN'), updateLesson);

// DELETE /:id - Delete lesson (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteLesson);

export default router;
