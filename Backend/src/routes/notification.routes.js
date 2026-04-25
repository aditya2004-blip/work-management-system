import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { db } from '../config/firebase.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get notifications for logged-in user (latest first, limit 30)
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .get();

    const notifications = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 30);

    res.json(notifications);
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// Mark a specific notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.id).update({ read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

// Mark all unread notifications as read for the user (batch update)
router.put('/read-all', async (req, res) => {
  try {
    const snap = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => batch.update(doc.ref, { read: true }));

    await batch.commit();

    res.json({ message: 'All marked as read' });
  } catch (err) { 
    res.status(500).json({ message: err.message }); 
  }
});

export default router;