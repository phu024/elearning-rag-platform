import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
} from './controller';
import { authenticate, authorize } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(generalRateLimiter);

// GET / - Get all published courses (or all for admin)
router.get('/', getAllCourses);

// GET /:id - Get course details (public for published)
router.get('/:id', getCourseById);

// POST / - Create new course (admin only)
router.post('/', authenticate, authorize('ADMIN'), createCourse);

// PUT /:id - Update course (admin only)
router.put('/:id', authenticate, authorize('ADMIN'), updateCourse);

// DELETE /:id - Delete course (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCourse);

// POST /:id/enroll - Enroll in course (authenticated learner)
router.post('/:id/enroll', authenticate, enrollCourse);

export default router;
