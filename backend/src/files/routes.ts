import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import {
  uploadFile,
  getFileById,
  deleteFile,
  getFileStatus,
} from './controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

router.post(
  '/:lessonId/upload',
  authenticate,
  authorize('ADMIN'),
  upload.single('file'),
  uploadFile
);

router.get('/:id', authenticate, getFileById);

router.delete('/:id', authenticate, authorize('ADMIN'), deleteFile);

router.get('/:id/status', authenticate, getFileStatus);

export default router;
