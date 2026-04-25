import { db } from '../config/firebase.js';

// Create a notification document for a specific user
export async function createNotification({
  userId,
  message,
  type = 'info',
  meta = {},
}) {
  if (!userId || !message) return null; // Validate required fields

  const ref = db.collection('notifications').doc();

  const doc = {
    id: ref.id,
    userId,
    message,
    type,
    read: false, // Default unread
    meta,
    createdAt: new Date().toISOString(),
  };

  await ref.set(doc);
  return doc;
}

// Send notifications to multiple users (removes duplicates)
export async function notifyUsers(userIds, payload) {
  const unique = [...new Set((userIds || []).filter(Boolean))];
  if (unique.length === 0) return [];

  return Promise.all(
    unique.map((userId) =>
      createNotification({ userId, ...payload })
    )
  );
}

// Fetch users based on roles (used for role-based notifications)
export async function getUsersByRoles(roles = []) {
  const r = roles.filter(Boolean);
  if (r.length === 0) return [];

  // Firestore 'in' query for multiple roles
  const snap = await db.collection('users').where('role', 'in', r).get();

  return snap.docs.map((d) => d.data());
}