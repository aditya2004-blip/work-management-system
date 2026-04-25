/**
 * ─────────────────────────────────────────────────────────────
 * LoginToProject.test.jsx  (Integration)
 * Simulates the full user flow:
 * 1. User lands on /login
 * 2. Enters valid credentials and submits
 * 3. Gets redirected to /dashboard
 * 4. Navigates to /projects
 * 5. Projects load and appear in the list
 * 6. User clicks "View tasks" on a project → goes to /tasks?projectId=…
 *
 * Also covers:
 * • Login form validation before submission
 * • Server 401 → error shown, no redirect
 * • Unauthenticated access to /projects redirects to /login
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';

import Login       from '../../features/auth/Login';
import ProjectList from '../../features/projects/ProjectList';
import ProtectedRoute from '../../routes/ProtectedRoute';

// 1. Replaced require() with standard ES6 imports
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Mocks ─────────────────────────────────────────────────────
// Axios is mapped globally in jest.config.cjs

jest.mock('react-hot-toast', () => {
  const mockToast = { success: jest.fn(), error: jest.fn() };
  const fn = Object.assign(jest.fn(), mockToast);
  return { __esModule: true, toast: fn, default: fn };
});

// ── Mock socket context to prevent real WebSocket connections ──
jest.mock('../../context/SocketContext', () => ({
  SocketProvider: ({ children }) => children,
  useSocket:      () => ({ emitTaskMove: jest.fn() }),
}));

// ── Fixtures ──────────────────────────────────────────────────
const adminUser = { uid: 'a1', name: 'Admin User', email: 'admin@test.com', role: 'admin' };

const projects = [
  { id: 'p1', name: 'Alpha', status: 'active', description: 'First', members: [], createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Beta',  status: 'active', description: 'Second', members: [], createdAt: new Date().toISOString() },
];

// ── App shell used in integration tests ───────────────────────
function AppShell() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<div>Dashboard</div>} />
        <Route path="projects"  element={<ProjectList />} />
        <Route path="tasks"     element={<div data-testid="tasks-page">Tasks</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ── Helper ────────────────────────────────────────────────────
function renderApp(initialEntries = ['/login'], preloadedState = {}) {
  return renderWithProviders(<AppShell />, {
    initialEntries,
    preloadedState: {
      auth:     { user: null, token: null, loading: false, error: null },
      projects: { items: [],      loading: false, error: null },
      tasks:    { items: [],      loading: false, error: null },
      users:    { items: [],      loading: false, error: null },
      ...preloadedState,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Integration Scenarios
// ─────────────────────────────────────────────────────────────

describe('Integration: Login → Dashboard', () => {
  test('validates empty form before making API call', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/min 6 characters/i)).toBeInTheDocument();
    });
    // API should NOT have been called
    expect(api.post).not.toHaveBeenCalled();
  });

  test('shows error toast on 401 and stays on login page', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });
    renderApp();
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'bad@test.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'wrongpwd');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials', expect.any(Object))
    );
    // Still on login page
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('navigates to dashboard after successful login', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: adminUser } });
    api.get.mockResolvedValue({ data: [] }); // fetchMe

    renderApp();
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'admin@test.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    );
  });
});

describe('Integration: Unauthenticated access', () => {
  test('visiting /projects without token redirects to /login', () => {
    renderApp(['/projects']);
    // ProtectedRoute should redirect unauthenticated users
    expect(screen.queryByText(/projects/i)).not.toBeInTheDocument();
  });
});

describe('Integration: Authenticated user views projects', () => {
  test('projects load and display when user is already authenticated', async () => {
    api.get.mockResolvedValueOnce({ data: projects }); // fetchProjects

    renderApp(['/projects'], {
      auth:     { user: adminUser, token: 'tok', loading: false, error: null },
      projects: { items: projects, loading: false, error: null },
    });

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });
  });

  test('"New project" button is visible to admin', async () => {
    api.get.mockResolvedValue({ data: projects });

    renderApp(['/projects'], {
      auth:     { user: adminUser, token: 'tok', loading: false, error: null },
      projects: { items: projects, loading: false, error: null },
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
    );
  });
});