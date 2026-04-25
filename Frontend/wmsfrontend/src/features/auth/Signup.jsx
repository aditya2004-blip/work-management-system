import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { signupUser, clearError } from './authSlice.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

// Validation schema
const schema = yup.object({
    name: yup.string().min(2).required('Name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
    role: yup.string().oneOf(['admin', 'manager', 'employee']).required(),
});

const Signup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notify } = useNotification(); // Notification context
    const { loading, error } = useSelector((s) => s.auth);
    const [showPass, setShowPass] = useState(false);

    // Form setup with default role
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: { role: 'employee' },
    });

    // Show error toast
    useEffect(() => {
        if (error) {
            notify(error, 'error');
            dispatch(clearError());
        }
    }, [error, notify, dispatch]);

    // Handle signup
    const onSubmit = async (data) => {
        const result = await dispatch(signupUser(data));

        if (signupUser.fulfilled.match(result)) {
            notify('Account created! Welcome aboard 🎉', 'success');
            navigate('/dashboard', { replace: true });
        }
    };

    // Common input styles
    const inputBase = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Zap size={26} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
                </div>

                {/* Signup form */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

                        {/* Name & Email fields */}
                        {[
                            { name: 'name', label: 'Full name', type: 'text', placeholder: 'Jane Doe' },
                            { name: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
                        ].map((f) => (
                            <div key={f.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {f.label}
                                </label>
                                <input
                                    {...register(f.name)}
                                    type={f.type}
                                    placeholder={f.placeholder}
                                    className={inputBase}
                                />
                                {errors[f.name] && (
                                    <p className="text-red-500 text-xs mt-1">{errors[f.name].message}</p>
                                )}
                            </div>
                        ))}

                        {/* Password field with toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    className={`${inputBase} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Role selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                            <select {...register('role')} className={inputBase}>
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors mt-1"
                        >
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    {/* Redirect to login */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;