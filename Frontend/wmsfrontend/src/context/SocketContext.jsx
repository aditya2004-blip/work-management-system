import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { taskAdded, taskUpdated, taskRemoved, taskMoved } from '../features/tasks/tasksSlice';
import { projectAdded, projectUpdated, projectDeleted } from '../features/projects/ProjectsSlice';
import { activityAdded } from '../features/dashboard/dashboardSlice';
import { useNotification } from './NotificationContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const dispatch = useDispatch();
    const { token } = useSelector((s) => s.auth);
    const { incrementUnread, notify } = useNotification();

    useEffect(() => {
        if (!token) return; // Only connect if user is authenticated

        // Initialize socket connection
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        const socket = socketRef.current;

        // Connection logs
        socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
        socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

        // Task events → update Redux store
        socket.on('task:created', (task) => dispatch(taskAdded(task)));
        socket.on('task:updated', (task) => dispatch(taskUpdated(task)));
        socket.on('task:deleted', (data) => dispatch(taskRemoved(data)));
        socket.on('task:moved', (data) => dispatch(taskMoved(data)));

        // Project events → update Redux store
        socket.on('project:created', (project) => dispatch(projectAdded(project)));
        socket.on('project:updated', (project) => dispatch(projectUpdated(project)));
        socket.on('project:deleted', (data) => dispatch(projectDeleted(data)));

        // Activity updates
        socket.on('activity:new', (activity) => dispatch(activityAdded(activity)));

        // Real-time notifications (badge + toast)
        socket.on('notification:new', (notification) => {
            if (notification?.message) {
                incrementUnread();
                notify(notification.message, notification.type || 'info');
            }
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [token, dispatch, incrementUnread, notify]);

    // Join a project room
    const joinProject = useCallback((projectId) => {
        socketRef.current?.emit('join:project', projectId);
    }, []);

    // Leave a project room
    const leaveProject = useCallback((projectId) => {
        socketRef.current?.emit('leave:project', projectId);
    }, []);

    // Emit task movement (drag-drop)
    const emitTaskMove = useCallback((data) => {
        socketRef.current?.emit('task:move', data);
    }, []);

    return (
        <SocketContext.Provider value={{ joinProject, leaveProject, emitTaskMove }}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook to use socket context
export const useSocket = () => {
    const ctx = useContext(SocketContext);

    if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');

    return ctx;
};