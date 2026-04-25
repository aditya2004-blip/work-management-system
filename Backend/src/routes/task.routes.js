import { Router } from "express";

import { getTasks, createTask, updateTask, deleteTask, addComment } from "../controllers/task.controller.js";
import authenticate from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";

const router = Router();

// Apply authentication to all task routes
router.use(authenticate);

// Get tasks (filtered by role inside controller)
router.get('/', getTasks);

// Only admin/manager can create tasks
router.post('/', roleGuard('admin', 'manager'), createTask);

// Update task (employees limited to status update in controller)
router.put('/:id', updateTask);

// Only admin/manager can delete tasks
router.delete('/:id', roleGuard('admin', 'manager'), deleteTask);

// Add comment to a task
router.post('/:id/comments', addComment);

export default router;