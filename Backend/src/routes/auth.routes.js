import { Router } from 'express';
import { signup, login, getMe, changePassword } from '../controllers/auth.controller.js';
import authenticate from '../middleware/auth.js';

const router = Router();

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (require valid JWT)
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

export default router;