import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { queryChatbot, getChatHistory } from './controller';

const router = Router();

router.post('/query', authenticate, queryChatbot);

router.get('/history/:lessonId', authenticate, getChatHistory);

export default router;
