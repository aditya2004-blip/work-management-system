import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'

// Generate JWT token with user details
const signToken = (user) => {
  return jwt.sign(
    { uid: user.uid, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Centralized error handler (handles Firestore-specific errors)
const handleAuthError = (res, err) => {
  if (err?.code === 5) { // Firestore NOT_FOUND error
    return res.status(503).json({
      message:
        'Firestore database not found for configured project/database. Check FIREBASE_PROJECT_ID, FIREBASE_DATABASE_ID, and Firestore setup in Firebase console.',
    });
  }
  return res.status(500).json({ message: err.message || 'Internal Server Error' });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const usersRef = db.collection('users');

    // Check if email already exists
    const existing = await usersRef.where('email', '==', email).get();
    if (!existing.empty) return res.status(400).json({ message: 'Email already registered' });

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const uid = usersRef.doc().id;

    const user = {
      uid,
      name,
      email,
      passwordHash,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    await usersRef.doc(uid).set(user);

    // Generate token and remove password before sending response
    const token = signToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) return res.status(401).json({ message: 'Invalid credentials' });

    const userDoc = snap.docs[0].data();

    // Compare password
    const isMatch = await bcrypt.compare(password, userDoc.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check account status
    if (userDoc.status && userDoc.status !== 'active') {
      return res.status(403).json({
        message: 'Your account has been suspended. Please contact an administrator.',
      });
    }

    // Update last activity and generate token
    const lastActivity = new Date().toISOString();
    await db.collection('users').doc(userDoc.uid).update({ lastActivity });

    const token = signToken(userDoc);
    const { passwordHash: _, ...safeUser } = { ...userDoc, lastActivity };

    return res.json({ token, user: safeUser });
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const getMe = async (req, res) => {
  try {
    // Fetch current logged-in user
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });

    // Remove password before sending response
    const { passwordHash: _, ...safeUser } = doc.data();
    return res.json(safeUser);
  } catch (err) {
    return handleAuthError(res, err);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    // Get user data
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });

    const user = doc.data();

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    // Hash and update new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.collection('users').doc(req.user.uid).update({ passwordHash });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return handleAuthError(res, err);
  }
};