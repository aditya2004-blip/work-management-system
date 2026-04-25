import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './features/auth/authSlice';

// Global context providers for cross-cutting concerns
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ModalProvider } from './context/ModalContext';

// Layout and route guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import Loader from './components/common/Loader';

// Lazy-loaded feature modules to enable code splitting and improve performance
const Login = lazy(() => import('./features/auth/Login'));
const Signup = lazy(() => import('./features/auth/Signup'));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const ProjectList = lazy(() => import('./features/projects/ProjectList'));
const KanbanBoard = lazy(() => import('./features/tasks/KanbanBoard'));
const UserManagement = lazy(() => import('./features/users/UserManagement'));
const Reports = lazy(() => import('./features/reports/Reports'));
const Settings = lazy(() => import('./features/settings/Settings'));

const AppRoutes = () => {
  const dispatch = useDispatch();

  // Access authentication token from Redux store
  const { token } = useSelector((s) => s.auth);

  // When a token is present, fetch the current authenticated user's details
  // This ensures user state is restored on page refresh
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [token, dispatch]);

  return (
    // Application-level providers wrapping the entire routing tree
    <ThemeProvider>
      <NotificationProvider>
        <SocketProvider>
          <ModalProvider>

            {/* Global toast notification configuration */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: '10px', fontSize: '14px' },
                success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              }}
            />

            {/* Suspense handles fallback UI while lazy components are loading */}
            <Suspense fallback={<Loader />}>

              <Routes>

                {/* Public routes (no authentication required) */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected route wrapper ensures authentication before rendering layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Default route redirects to dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* General authenticated routes */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<ProjectList />} />
                  <Route path="tasks" element={<KanbanBoard />} />
                  <Route path="settings" element={<Settings />} />

                  {/* Role-based protected routes */}
                  <Route
                    path="reports"
                    element={
                      <RoleRoute roles={['admin', 'manager']}>
                        <Reports />
                      </RoleRoute>
                    }
                  />

                  <Route
                    path="users"
                    element={
                      <RoleRoute roles={['admin']}>
                        <UserManagement />
                      </RoleRoute>
                    }
                  />
                </Route>

                {/* Fallback route for undefined paths */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

              </Routes>
            </Suspense>

          </ModalProvider>
        </SocketProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default AppRoutes;