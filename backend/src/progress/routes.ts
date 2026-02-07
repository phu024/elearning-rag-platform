import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rateLimiter';
import {
  getMyProgress,
  markLessonComplete,
  updateLastViewed,
} from './controller';

const router = Router();

router.use(generalRateLimiter);

router.get('/me', authenticate, getMyProgress);

router.post('/lessons/:lessonId/complete', authenticate, markLessonComplete);

router.post('/lessons/:lessonId/view', authenticate, updateLastViewed);

export default router;
