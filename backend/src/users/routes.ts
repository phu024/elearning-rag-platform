import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from './controller';
import { authenticate, authorize } from '../middleware/auth';
import { generalRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All routes require authentication
router.use(generalRateLimiter);

// GET / - Get all users (admin only)
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);

// GET /:id - Get user by ID (authenticated)
router.get('/:id', authenticate, getUserById);

// PUT /:id - Update user (authenticated, own user or admin)
router.put('/:id', authenticate, updateUser);

// DELETE /:id - Delete user (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;
