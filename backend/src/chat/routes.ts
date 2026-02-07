import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rateLimiter';
import { queryChatbot, getChatHistory } from './controller';

const router = Router();

router.use(generalRateLimiter);

router.post('/query', authenticate, queryChatbot);

router.get('/history/:lessonId', authenticate, getChatHistory);

export default router;
