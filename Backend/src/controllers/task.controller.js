import { db } from "../config/firebase.js";
import { getUsersByRoles, notifyUsers } from '../helpers/notifications.js';

export const getTasks = async (req, res) => {
    try {
        let query = db.collection('tasks');

        // Filter by project if provided
        if (req.query.projectId) query = query.where('projectId', '==', req.query.projectId);

        // Employees see only their assigned tasks
        if (req.user.role === 'employee') {
            query = query.where('assigneeId', '==', req.user.uid);
        }

        const snap = await query.get();
        const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Sort tasks by latest created
        tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.json(tasks);
    } catch (err) {
        console.error('[GetTasks Error]:', err);
        res.status(500).json({ message: err.message });
    }
};

export const createTask = async (req, res) => {
    try {
        const { title, description, type = 'feature', priority = 'medium', status = 'todo', projectId, assigneeId, dueDate } = req.body;

        // Create new task
        const ref = db.collection('tasks').doc();
        const task = {
            id: ref.id,
            title,
            description,
            type,
            priority,
            status,
            projectId,
            assigneeId,
            dueDate,
            comments: [],
            attachments: [],
            createdBy: req.user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ref.set(task);

        // Log activity
        await db.collection('activities').add({
            type: 'task_created',
            title: `Task "${title}" created`,
            userId: req.user.uid,
            userName: req.user.name,
            projectId,
            taskId: ref.id,
            createdAt: new Date().toISOString()
        });

        // Emit real-time event
        const io = req.app.get('io');
        io.emit('task:created', task);

        // Notify assignee + admins/managers
        const adminsAndManagers = await getUsersByRoles(['admin', 'manager']);
        const mgmtIds = adminsAndManagers.map((u) => u.uid);

        const recipients = [
            ...(assigneeId ? [assigneeId] : []),
            ...mgmtIds,
        ].filter((uid) => uid && uid !== req.user.uid);

        const notifications = await notifyUsers(recipients, {
            type: 'task_created',
            message: `New task: "${title}"`,
            meta: { taskId: ref.id, projectId: projectId || null, createdBy: req.user.uid },
        });

        notifications.forEach((n) => n && io.to(`user:${n.userId}`).emit('notification:new', n));

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        let allowedUpdates;

        // Employees can only update status of their assigned tasks
        if (req.user.role === 'employee') {
            const { status } = req.body;

            if (!status) {
                return res.status(403).json({ message: 'Employees can only update task status.' });
            }

            const taskDoc = await db.collection('tasks').doc(id).get();
            if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

            if (taskDoc.data().assigneeId !== req.user.uid) {
                return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
            }

            allowedUpdates = { status, updatedAt: new Date().toISOString() };
        } else {
            // Admin/Manager can update any field
            allowedUpdates = { ...req.body, updatedAt: new Date().toISOString() };
        }

        await db.collection('tasks').doc(id).update(allowedUpdates);

        // Emit update event
        const io = req.app.get('io');
        io.emit('task:updated', { id, ...allowedUpdates });

        // Notify user if task is assigned/reassigned
        if (req.user.role !== 'employee' &&
            Object.prototype.hasOwnProperty.call(req.body, 'assigneeId') &&
            req.body.assigneeId) {

            const notifications = await notifyUsers([req.body.assigneeId], {
                type: 'task_assigned',
                message: `You were assigned a task`,
                meta: { taskId: id, projectId: req.body.projectId || null, assignedBy: req.user.uid },
            });

            notifications.forEach((n) => n && io.to(`user:${n.userId}`).emit('notification:new', n));
        }

        res.json({ id, ...allowedUpdates });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteTask = async (req, res) => {
    try {
        // Delete task
        await db.collection('tasks').doc(req.params.id).delete();
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const addComment = async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await db.collection('tasks').doc(id).get();
        if (!doc.exists) return res.status(404).json({ message: 'Task not found' });

        // Employees can only comment on their assigned tasks
        if (req.user.role === 'employee' && doc.data().assigneeId !== req.user.uid) {
            return res.status(403).json({ message: 'You can only comment on tasks assigned to you.' });
        }

        const comments = doc.data().comments || [];

        // Create new comment
        const newComment = {
            id: Date.now().toString(),
            text: req.body.text,
            userId: req.user.uid,
            userName: req.user.name,
            createdAt: new Date().toISOString()
        };

        // Append comment
        await db.collection('tasks').doc(id).update({ comments: [...comments, newComment] });

        res.json(newComment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};