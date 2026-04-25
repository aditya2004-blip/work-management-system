// Style variants for different labels (status, role, priority, etc.)
const VARIANTS = {
  bug: 'bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300',
  feature: 'bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300',
  improvement: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  high: 'bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  low: 'bg-gray-100  text-gray-700  dark:bg-gray-800     dark:text-gray-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  archived: 'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400',
  inactive: 'bg-gray-100  text-gray-600  dark:bg-gray-800     dark:text-gray-400',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  manager: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  employee: 'bg-gray-100  text-gray-700  dark:bg-gray-800     dark:text-gray-400',
  todo: 'bg-gray-100  text-gray-700  dark:bg-gray-800     dark:text-gray-400',
  'in-progress': 'bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

// Reusable badge component for displaying labeled statuses
const Badge = ({ label, variant }) => (
  <span
    // Apply variant styles, fallback to 'employee' if variant not found
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${VARIANTS[variant] || VARIANTS.employee}`}
  >
    {label}
  </span>
);

export default Badge;