import { useState, useEffect } from "react";
import { X, CheckCheck, Bell } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import api from "../../api/axios";

const NotificationPanel = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch notifications on mount
    useEffect(() => {
        api.get('/notifications')
            .then((r) => setNotifications(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Mark single notification as read
    const markRead = async (id) => {
        await api.put(`/notifications/${id}/read`).catch(() => { });
        setNotifications((ns) =>
            ns.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    // Mark all notifications as read
    const markAllRead = async () => {
        await api.put('/notifications/read-all').catch(() => { });
        setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    };

    // Count unread notifications
    const unread = notifications.filter((n) => !n.read).length;

    return (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Bell size={15} className="text-gray-500" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</span>

                    {/* Unread count */}
                    {unread > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                            {unread}
                        </span>
                    )}
                </div>

                <div className="flex gap-1">
                    {/* Mark all as read */}
                    {unread > 0 && (
                        <button
                            onClick={markAllRead}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                        >
                            <CheckCheck size={15} />
                        </button>
                    )}

                    {/* Close panel */}
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                    // Loading spinner
                    <div className="flex items-center justify-center h-20">
                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : notifications.length === 0 ? (
                    // Empty state
                    <p className="text-center text-gray-400 text-sm py-10">
                        No notifications yet
                    </p>
                ) : (
                    // Notification items
                    notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 flex items-start gap-3 ${!n.read
                                    ? 'bg-indigo-50/60 dark:bg-indigo-900/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                }`}
                        >
                            {/* Unread indicator */}
                            <div
                                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'
                                    }`}
                            />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                                    {n.message}
                                </p>

                                {/* Time ago */}
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                </p>
                            </div>

                            {/* Mark as read */}
                            {!n.read && (
                                <button
                                    onClick={() => markRead(n.id)}
                                    className="text-xs text-indigo-500 hover:text-indigo-700 flex-shrink-0"
                                >
                                    Read
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;