import { db } from "../config/firebase.js";
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
    try {
        const snap = await db.collection('users').get();

        // Exclude passwordHash before sending response
        const users = snap.docs.map(d => {
            const { passwordHash, ...u } = d.data();
            return u;
        });

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, status } = req.body;

        // Update user basic details
        await db.collection('users').doc(id).update({
            name,
            role,
            status,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        // Delete user by ID
        await db.collection('users').doc(req.params.id).delete();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;

        // Update logged-in user's profile
        await db.collection('users').doc(req.user.uid).update({
            name,
            avatar,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: 'Profile updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}