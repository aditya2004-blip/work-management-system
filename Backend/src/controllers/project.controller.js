import { db } from "../config/firebase.js";
import { FieldValue } from 'firebase-admin/firestore'
import { getUsersByRoles, notifyUsers } from '../helpers/notifications.js';

export const getProjects = async (req, res) => {
    try {
        let snap;

        // Role-based access: employees see only assigned projects
        if (req.user.role === 'employee') {
            snap = await db.collection('projects')
                .where('members', 'array-contains', req.user.uid)
                .get();
        } else {
            // Admin/Manager get all projects
            snap = await db.collection('projects').get();
        }

        // Sort projects by createdAt (latest first)
        const projects = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });

        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const createProject = async (req, res) => {
    try {
        const { name, description, status = "active", dueDate, members = [] } = req.body

        // Create new project document
        const ref = db.collection('projects').doc()
        const project = {
            id: ref.id,
            name,
            description,
            status,
            dueDate,
            members,
            createdBy: req.user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        await ref.set(project)

        // Log activity
        await db.collection('activities').add({
            type: 'project_created',
            title: `Project "${name}" created`,
            userId: req.user.uid,
            userName: req.user.name,
            projectId: ref.id,
            createdAt: new Date().toISOString()
        });

        // Emit real-time event
        const io = req.app.get('io');
        io.emit('project:created', project);

        // Prepare notification recipients (admins + members except creator)
        const adminUsers = await getUsersByRoles(['admin']);
        const adminIds = adminUsers.map((u) => u.uid);
        const memberIds = (members || [])
            .map((m) => (typeof m === 'string' ? m : m?.uid))
            .filter(Boolean);

        const recipients = [
          ...(req.user.role === 'manager' ? adminIds : []),
          ...memberIds,
        ].filter((uid) => uid && uid !== req.user.uid);

        // Send notifications
        const notifications = await notifyUsers(recipients, {
          type: 'project_created',
          message: `New project: "${name}"`,
          meta: { projectId: ref.id, createdBy: req.user.uid },
        });

        // Emit notification events to specific users
        notifications.forEach((n) =>
          n && io.to(`user:${n.userId}`).emit('notification:new', n)
        );

        res.status(201).json(project);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const updateProject = async (req, res) => {
    try {
        const { id } = req.params

        // Update project with new data + timestamp
        const updates = { ...req.body, updatedAt: new Date().toISOString() }

        await db.collection('projects').doc(id).update(updates)
        res.json({ id, ...updates })
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const deleteProject = async (req, res) => {
    try {
        // Delete project
        await db.collection('projects').doc(req.params.id).delete();

        // Emit real-time delete event
        const io = req.app.get('io');
        io.emit('project:deleted', { id: req.params.id });

        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}