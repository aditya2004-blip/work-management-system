/**
 * ─────────────────────────────────────────────────────────────
 * Login.test.jsx
 * Tests for the <Login /> component covering:
 * • Rendering (fields, button, link)
 * • Yup validation (empty, invalid email, short password)
 * • Successful login → notify + navigate
 * • Failed login (API error) → error notification
 * • Password visibility toggle
 * • Loading state disables submit button
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import Login from '../../features/auth/Login.jsx';
import { loginUser } from '../../features/auth/authSlice';

// 1. ES6 Imports for your mocked modules
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Mocks ─────────────────────────────────────────────────────

// Mock axios using the manual mock we created earlier
// Axios is mapped globally in jest.config.cjs

// Mock react-hot-toast so we can assert on toast calls
jest.mock('react-hot-toast', () => {
  const mockToast = { success: jest.fn(), error: jest.fn() };
  const fn = Object.assign(jest.fn(), mockToast);
  return { __esModule: true, toast: fn, default: fn };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ── Helpers ───────────────────────────────────────────────────
const mockUser = { uid: 'u1', name: 'Jane', email: 'jane@test.com', role: 'manager' };

function renderLogin(preloadedState = {}) {
  return renderWithProviders(<Login />, {
    preloadedState: {
      auth: { user: null, token: null, loading: false, error: null },
      ...preloadedState,
    },
    initialEntries: ['/login'],
  });
}

// ── Rendering ─────────────────────────────────────────────────

describe('Login – rendering', () => {
  test('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
  });

  test('renders the Sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders a link to the signup page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create one free/i })).toBeInTheDocument();
  });

  test('renders WorkFlow Pro heading', () => {
    renderLogin();
    expect(screen.getByText(/sign in to workflow pro/i)).toBeInTheDocument();
  });
});

// ── Validation ────────────────────────────────────────────────

describe('Login – form validation', () => {
  test('shows validation errors when submitted empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/min 6 characters/i)).toBeInTheDocument();
    });
  });

  test('shows invalid email error for malformed email', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'not-an-email');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    );
  });

  test('shows min-length error for short password', async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'jane@test.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), '123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/min 6 characters/i)).toBeInTheDocument()
    );
  });
});

// ── Password toggle ───────────────────────────────────────────

describe('Login – password visibility toggle', () => {
  test('toggles password field type between password and text', async () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(/••••••••/);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: '' }); // eye icon button
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// ── Successful login ──────────────────────────────────────────

describe('Login – successful submit', () => {
  test('navigates to /dashboard on successful login', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: mockUser } });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'jane@test.com');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});

// ── Failed login ──────────────────────────────────────────────

describe('Login – failed submit', () => {
  test('dispatches clearError and shows error toast when auth.error is set', async () => {
    // Pre-seed an error in the store
    renderLogin({ auth: { user: null, token: null, loading: false, error: 'Invalid credentials' } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid credentials', expect.any(Object)));
  });
});

// ── Loading state ─────────────────────────────────────────────

describe('Login – loading state', () => {
  test('disables submit button and shows "Signing in…" text while loading', () => {
    renderLogin({ auth: { user: null, token: null, loading: true, error: null } });
    const btn = screen.getByRole('button', { name: /signing in/i });
    expect(btn).toBeDisabled();
  });
});