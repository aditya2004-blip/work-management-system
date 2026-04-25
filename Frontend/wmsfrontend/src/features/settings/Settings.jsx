// Dependencies:
// react, react-redux → state management
// react-hook-form + yup → form handling & validation
// lucide-react → icons
// axios → API calls

// Consumes:
// authSlice (Redux) → user, setUser
// ThemeContext → darkMode, toggleDark
// NotificationContext → notify()

import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Sun, Moon, User, Lock, Shield } from 'lucide-react';
import api from '../../api/axios.jsx';
import { setUser } from '../auth/authSlice.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Button from '../../components/common/Button.jsx';
import Badge from '../../components/common/Badge.jsx';


// ---------------- VALIDATION SCHEMA ----------------
// Used for password change form
const passSchema = yup.object({
    currentPassword: yup.string().required('Required'),
    newPassword: yup.string().min(6, 'Min 6 chars').required('Required'),
});


// Shared input styling
const inputClass = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';


// Reusable card wrapper component
const Card = ({ icon: Icon, title, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-5">
            <Icon size={18} className="text-gray-500" />
            {title}
        </h2>
        {children}
    </div>
);


const Settings = () => {
    const dispatch = useDispatch();

    // Get current user from Redux
    const { user } = useSelector((s) => s.auth);

    // Theme context (dark/light toggle)
    const { darkMode, toggleDark } = useTheme();

    // Notification context (toast messages)
    const { notify } = useNotification();


    // ---------------- PROFILE FORM ----------------
    const {
        register: regProfile,
        handleSubmit: handleProfile,
        formState: { isSubmitting: pSub }
    } = useForm({
        defaultValues: { name: user?.name || '' }
    });


    // ---------------- PASSWORD FORM ----------------
    const {
        register: regPass,
        handleSubmit: handlePass,
        reset: resetPass,
        formState: { errors: pErr, isSubmitting: passLoading }
    } = useForm({
        resolver: yupResolver(passSchema)
    });


    // ---------------- HANDLERS ----------------

    // Update profile (name)
    const onProfileSubmit = async (data) => {
        try {
            await api.put('/users/profile', data);

            // Update Redux state
            dispatch(setUser({ ...user, ...data }));

            notify('Profile updated', 'success');
        } catch (err) {
            notify(err.response?.data?.message || 'Failed to update', 'error');
        }
    };


    // Change password
    const onPassSubmit = async (data) => {
        try {
            await api.put('/auth/change-password', data);

            notify('Password changed successfully', 'success');

            // Clear form fields
            resetPass();
        } catch (err) {
            notify(err.response?.data?.message || 'Failed to change password', 'error');
        }
    };


    return (
        <div className="space-y-6 max-w-2xl">

            {/* -------- HEADER -------- */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 mt-1 text-sm">Manage your account and preferences</p>
            </div>


            {/* -------- THEME SETTINGS -------- */}
            <Card icon={darkMode ? Moon : Sun} title="Appearance">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Dark mode</p>
                        <p className="text-xs text-gray-400">Saved in localStorage</p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        onClick={toggleDark}
                        className={`relative w-12 h-6 rounded-full transition-colors 
                        ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow 
                            transition-transform ${darkMode ? 'translate-x-6' : ''}`}
                        />
                    </button>
                </div>
            </Card>


            {/* -------- PROFILE SECTION -------- */}
            {/* FIXED BUG: removed '=' before <Card */}
            <Card icon={User} title="Profile">

                {/* User Info */}
                <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-xl">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>

                    <div>
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge label={user?.role} variant={user?.role} />
                    </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
                    <input {...regProfile('name')} className={inputClass} />

                    <input
                        value={user?.email || ''}
                        disabled
                        className={`${inputClass} opacity-50 cursor-not-allowed`}
                    />

                    <Button type="submit" loading={pSub}>
                        Save profile
                    </Button>
                </form>
            </Card>


            {/* -------- PASSWORD SECTION -------- */}
            <Card icon={Lock} title="Security">
                <form onSubmit={handlePass(onPassSubmit)} className="space-y-4">

                    <input {...regPass('currentPassword')} type="password" className={inputClass} />
                    {pErr.currentPassword && <p className="text-red-500 text-xs">{pErr.currentPassword.message}</p>}

                    <input {...regPass('newPassword')} type="password" className={inputClass} />
                    {pErr.newPassword && <p className="text-red-500 text-xs">{pErr.newPassword.message}</p>}

                    <Button type="submit" loading={passLoading}>
                        Change password
                    </Button>
                </form>
            </Card>


            {/* -------- ROLE / PERMISSIONS -------- */}
            <Card icon={Shield} title="Permissions">
                <div className="space-y-2 text-sm">

                    <p>
                        Role: <strong className="capitalize">{user?.role}</strong>
                    </p>

                    {/* Role-based UI */}
                    {user?.role === 'admin' && (
                        <p className="text-green-600">✓ Full system access</p>
                    )}

                    {user?.role === 'manager' && (
                        <p className="text-blue-600">✓ Manage projects & tasks</p>
                    )}

                    {user?.role === 'employee' && (
                        <p className="text-gray-500">✓ Limited access</p>
                    )}
                </div>
            </Card>

        </div>
    );
};

export default Settings;