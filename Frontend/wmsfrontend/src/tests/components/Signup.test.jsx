/**
 * ─────────────────────────────────────────────────────────────
 * Signup.test.jsx
 * Tests for the <Signup /> component covering:
 * • Rendering (name / email / password / role fields)
 * • Validation (required, min-length, invalid email)
 * • Role selector options
 * • Password visibility toggle
 * • Successful signup → navigate to /dashboard
 * • Error from store → toast notification
 * • Loading state
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import Signup from '../../features/auth/Signup';

// 1. Replaced require() with ES6 imports
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Mocks ─────────────────────────────────────────────────────
// Axios is mapped globally

jest.mock('react-hot-toast', () => {
  const mockToast = { success: jest.fn(), error: jest.fn() };
  const fn = Object.assign(jest.fn(), mockToast);
  return { __esModule: true, toast: fn, default: fn };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUser = { uid: 'u1', name: 'Alice', email: 'alice@test.com', role: 'employee' };

function renderSignup(authOverrides = {}) {
  return renderWithProviders(<Signup />, {
    preloadedState: {
      auth: { user: null, token: null, loading: false, error: null, ...authOverrides },
    },
    initialEntries: ['/signup'],
  });
}

// ── Rendering ─────────────────────────────────────────────────

describe('Signup – rendering', () => {
  test('renders all form fields', () => {
    renderSignup();
    expect(screen.getByPlaceholderText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@company\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min\. 6 characters/i)).toBeInTheDocument();
  });

  test('renders role select with three options', () => {
    renderSignup();
    const select = screen.getByRole('combobox');
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(expect.arrayContaining(['employee', 'manager', 'admin']));
  });

  test('renders Create account button', () => {
    renderSignup();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('renders a link back to /login', () => {
    renderSignup();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  test('role defaults to "employee"', () => {
    renderSignup();
    expect(screen.getByRole('combobox')).toHaveValue('employee');
  });
});

// ── Validation ────────────────────────────────────────────────

describe('Signup – validation', () => {
  test('shows required errors when form submitted empty', async () => {
    renderSignup();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/min 6 characters/i)).toBeInTheDocument();
    });
  });

  test('shows invalid email error', async () => {
    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'bad-email');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/invalid email/i)).toBeInTheDocument());
  });

  test('shows min-6-character error for short password', async () => {
    renderSignup();
    await userEvent.type(screen.getByPlaceholderText(/min\. 6 characters/i), '123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/min 6 characters/i)).toBeInTheDocument());
  });
});

// ── Password visibility toggle ────────────────────────────────

describe('Signup – password toggle', () => {
  test('toggles password input type', async () => {
    renderSignup();
    const passwordInput = screen.getByPlaceholderText(/min\. 6 characters/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(screen.getByRole('button', { name: '' }));
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

// ── Successful signup ─────────────────────────────────────────

describe('Signup – successful submit', () => {
  test('navigates to /dashboard after successful signup', async () => {
    api.post.mockResolvedValueOnce({ data: { token: 'tok', user: mockUser } });
    renderSignup();

    await userEvent.type(screen.getByPlaceholderText(/jane doe/i), 'Alice');
    await userEvent.type(screen.getByPlaceholderText(/you@company\.com/i), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText(/min\. 6 characters/i), 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});

// ── Error handling ────────────────────────────────────────────

describe('Signup – error from store', () => {
  test('shows toast.error when auth.error is set', async () => {
    renderSignup({ error: 'Email already registered' });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email already registered', expect.any(Object)));
  });
});

// ── Loading ───────────────────────────────────────────────────

describe('Signup – loading state', () => {
  test('disables button and shows "Creating account…" text', () => {
    renderSignup({ loading: true });
    const btn = screen.getByRole('button', { name: /creating account/i });
    expect(btn).toBeDisabled();
  });
});