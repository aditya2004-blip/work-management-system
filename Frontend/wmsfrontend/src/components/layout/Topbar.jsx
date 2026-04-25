import { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import useDebounce from '../../hooks/useDebounce.jsx';
import NotificationPanel from '../notifications/NotificationPanel.jsx';

const Topbar = () => {
    const { darkMode, toggleDark } = useTheme(); // Theme context
    const { unreadCount, clearUnread } = useNotification(); // Notification context

    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifRef = useRef(null);

    // Debounced search value (for API calls / filtering)
    const debouncedQuery = useDebounce(searchQuery, 400);

    useEffect(() => {
        // Close notification panel when clicking outside
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setShowNotifications(false);
        };
    }, []);

    // Toggle notification panel and clear unread count
    const handleOpenNotifications = () => {
        setShowNotifications((v) => !v);
        if (!showNotifications) clearUnread();
    };

    return (
        <header className="h-16 flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 gap-4">

            {/* Search input */}
            <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, tasks…"
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            <div className="flex items-center gap-1">

                {/* Theme toggle button */}
                <button
                    onClick={toggleDark}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Toggle theme"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleOpenNotifications}
                        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Bell size={18} />

                        {/* Unread count badge */}
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-0.5">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification dropdown panel */}
                    {showNotifications && (
                        <NotificationPanel onClose={() => setShowNotifications(false)} />
                    )}
                </div>
            </div>
        </header>
    );
}

export default Topbar;