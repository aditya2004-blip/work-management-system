import { Router } from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  updateProfile
} from '../controllers/user.controller.js';
import authenticate from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

// Admin & Manager can view all users
router.get('/', roleGuard('admin', 'manager'), getUsers);

// Logged-in user can update their own profile
router.put('/profile', updateProfile);

// Only admin can update user role/status
router.put('/:id', roleGuard('admin'), updateUser);

// Only admin can delete users
router.delete('/:id', roleGuard('admin'), deleteUser);

export default router;