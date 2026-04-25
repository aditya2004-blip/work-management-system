/**
 * ─────────────────────────────────────────────────────────────
 *  ProtectedRoute.test.jsx
 *  Tests for the <ProtectedRoute /> component:
 *    • Renders children when a token is present in the store
 *    • Redirects to /login when token is null (unauthenticated)
 *    • Preserves the intended location in state so login can redirect back
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../helpers/renderWithProviders';
import ProtectedRoute from '../../routes/ProtectedRoute';

jest.mock('../../api/axios');

// ── Helpers ───────────────────────────────────────────────────
function renderProtected({ token = null, path = '/dashboard' } = {}) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    {
      preloadedState: { auth: { user: null, token, loading: false, error: null } },
      initialEntries: [path],
    }
  );
}

// ── Tests ─────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  test('renders children when a token exists in the store', () => {
    renderProtected({ token: 'valid_token' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to /login when token is null', () => {
    renderProtected({ token: null });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('does not render children when token is absent', () => {
    renderProtected({ token: null });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children for any non-null token string', () => {
    renderProtected({ token: 'any_token_value' });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
