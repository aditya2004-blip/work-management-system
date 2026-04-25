import { Router } from 'express';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject 
} from '../controllers/project.controller.js';
import authenticate from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = Router();

// Apply authentication to all project routes
router.use(authenticate);

// Accessible to all authenticated users (role-based filtering handled in controller)
router.get('/', getProjects);

// Only admin and manager can create/update projects
router.post('/', roleGuard('admin', 'manager'), createProject);
router.put('/:id', roleGuard('admin', 'manager'), updateProject);

// Only admin can delete projects
router.delete('/:id', roleGuard('admin'), deleteProject);

export default router;