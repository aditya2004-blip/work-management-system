// Loader component with optional fullscreen mode
const Loader = ({ fullscreen = true, size = 'md' }) => {

  // Spinner size configurations
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4'
  };

  // Spinner UI
  const spinner = (
    <div className={`${sizes[size]} border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin`} />
  );

  // Return inline spinner if not fullscreen
  if (!fullscreen) return spinner;

  // Fullscreen centered loader
  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      {spinner}
    </div>
  );
};

export default Loader;