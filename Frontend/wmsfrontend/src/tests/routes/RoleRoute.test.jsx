/**
 * ─────────────────────────────────────────────────────────────
 *  RoleRoute.test.jsx
 *  Tests for the <RoleRoute /> component:
 *    • Renders children when user.role is in the allowed roles list
 *    • Redirects to /login when token is null
 *    • Returns null (renders nothing) when token present but user is still loading (null)
 *    • Redirects to /dashboard when user role is NOT in allowed roles
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';
import RoleRoute from '../../routes/RoleRoute';

jest.mock('../../api/axios');

// ── Fixtures ──────────────────────────────────────────────────
const adminUser    = { uid: 'a1', name: 'Admin',   role: 'admin'    };
const managerUser  = { uid: 'm1', name: 'Manager', role: 'manager'  };
const employeeUser = { uid: 'e1', name: 'Employee', role: 'employee' };

// ── Helpers ───────────────────────────────────────────────────
function renderRoleRoute({ user = null, token = 'tok', roles = ['admin', 'manager'] } = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/login"     element={<div>Login Page</div>} />
      <Route path="/dashboard" element={<div>Dashboard</div>} />
      <Route
        path="/reports"
        element={
          <RoleRoute roles={roles}>
            <div>Reports Page</div>
          </RoleRoute>
        }
      />
    </Routes>,
    {
      preloadedState: { auth: { user, token, loading: false, error: null } },
      initialEntries: ['/reports'],
    }
  );
}

// ── Tests ─────────────────────────────────────────────────────

describe('RoleRoute – access control', () => {
  test('renders children for admin when admin is in allowed roles', () => {
    renderRoleRoute({ user: adminUser, roles: ['admin', 'manager'] });
    expect(screen.getByText('Reports Page')).toBeInTheDocument();
  });

  test('renders children for manager when manager is in allowed roles', () => {
    renderRoleRoute({ user: managerUser, roles: ['admin', 'manager'] });
    expect(screen.getByText('Reports Page')).toBeInTheDocument();
  });

  test('redirects employee to /dashboard when employee not in allowed roles', () => {
    renderRoleRoute({ user: employeeUser, roles: ['admin', 'manager'] });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Reports Page')).not.toBeInTheDocument();
  });

  test('redirects to /login when token is null', () => {
    renderRoleRoute({ user: null, token: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders null (nothing) when token exists but user has not loaded yet', () => {
    const { container } = renderRoleRoute({ user: null, token: 'tok' });
    // No redirect, no content → container should be nearly empty
    expect(screen.queryByText('Reports Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('allows access when a single role matches exactly', () => {
    renderRoleRoute({ user: adminUser, roles: ['admin'] });
    expect(screen.getByText('Reports Page')).toBeInTheDocument();
  });

  test('denies access when role list does not contain user role', () => {
    renderRoleRoute({ user: managerUser, roles: ['admin'] });
    expect(screen.queryByText('Reports Page')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
