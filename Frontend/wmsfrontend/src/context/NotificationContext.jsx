import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { toast } from 'react-hot-toast';
import api from '../api/axios.jsx';
import { useSelector } from 'react-redux';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // Store unread notification count
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useSelector((s) => s.auth);

  // Fetch unread count from API when user logs in / token changes
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    api.get('/notifications')
      .then(({ data }) => {
        const count = data.filter((n) => !n.read).length;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
  }, [token]);

  // Increment unread count (used with real-time socket events)
  const incrementUnread = useCallback(() => {
    setUnreadCount((n) => n + 1);
  }, []);

  // Show toast notifications (UI only, does not affect unread count)
  const notify = useCallback((message, type = 'info') => {
    const id = `notif_${Date.now()}`;

    switch (type) {
      case 'success': toast.success(message, { id }); break;
      case 'error': toast.error(message, { id }); break;
      case 'warning': toast(message, { id, icon: '⚠️' }); break;
      default: toast(message, { id }); break;
    }
  }, []);

  // Reset unread count (when user opens notifications panel)
  const clearUnread = useCallback(() => setUnreadCount(0), []);

  // Memoize context value to optimize re-renders
  const value = useMemo(
    () => ({ notify, unreadCount, clearUnread, incrementUnread }),
    [notify, unreadCount, clearUnread, incrementUnread]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to access notification context
export const useNotification = () => {
  const ctx = useContext(NotificationContext);

  if (!ctx) throw new Error('useNotification must be used inside <NotificationProvider>');

  return ctx;
};