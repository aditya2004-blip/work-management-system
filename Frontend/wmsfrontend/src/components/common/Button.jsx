import { Loader2 } from "lucide-react";

// Button style variants
const VARIANTS = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-sm',
    secondary: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent',
};

// Button size variations
const SIZES = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-sm'
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <button
            // Disable button if loading or explicitly disabled
            disabled={disabled || loading}

            // Combine variant, size, and custom styles
            className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
            {...props}
        >
            {/* Show loading spinner when loading */}
            {loading && <Loader2 size={14} className="animate-spin" />}

            {children}
        </button>
    );
};

export default Button;