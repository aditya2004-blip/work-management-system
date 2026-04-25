import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { loginUser, clearError } from './authSlice';
import { useNotification } from '../../context/NotificationContext';

// Form validation schema
const schema = yup.object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notify } = useNotification(); // Notification context
    const { loading, error } = useSelector((s) => s.auth);
    const [showPass, setShowPass] = useState(false);

    // React Hook Form setup with Yup validation
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });

    // Show error toast if login fails
    useEffect(() => {
        if (error) {
            notify(error, 'error');
            dispatch(clearError());
        }
    }, [error, notify, dispatch]);

    // Handle login submit
    const onSubmit = async (data) => {
        const result = await dispatch(loginUser(data));

        if (loginUser.fulfilled.match(result)) {
            notify(`Welcome back, ${result.payload.user.name}!`, 'success');
            navigate('/dashboard', { replace: true });
        }
    };

    // Input styling helpers
    const inputBase = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';
    const errorBorder = (field) => errors[field] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Header / Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
                        <Zap size={26} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to WorkFlow Pro</h1>
                    <p className="text-gray-500 mt-2 text-sm">Your team's command centre</p>
                </div>

                {/* Login form */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                        {/* Email field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                className={`${inputBase} ${errorBorder('email')}`}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className={`${inputBase} pr-10 ${errorBorder('password')}`}
                                />

                                {/* Toggle password visibility */}
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors mt-2"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    {/* Redirect to signup */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        No account?{' '}
                        <Link to="/signup" className="text-indigo-600 hover:underline font-medium">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;