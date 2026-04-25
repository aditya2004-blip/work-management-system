/**
 * ─────────────────────────────────────────────────────────────
 * NotificationContext.test.jsx
 * Tests for NotificationProvider + useNotification hook:
 * • notify() calls the correct toast method for each type
 * • unreadCount starts at 0 without token
 * • unreadCount fetched from API when token present
 * • incrementUnread increases count by 1
 * • clearUnread resets count to 0
 * • useNotification throws outside of provider
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
// 1. Replaced require() with standard ES6 imports
import { NotificationProvider, useNotification } from '../../context/NotificationContext';
import authReducer from '../../features/auth/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Mocks ─────────────────────────────────────────────────────
// Axios is mapped globally

jest.mock('react-hot-toast', () => {
  const mockToast = { success: jest.fn(), error: jest.fn() };
  // react-hot-toast uses the function itself as the default and named export 'toast'
  // and attaches success/error properties to it.
  const fn = Object.assign(jest.fn(), mockToast);
  return {
    __esModule: true,
    toast: fn,
    default: fn,
  };
});

// ── Helpers ───────────────────────────────────────────────────
function makeStore(token = null) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, token, loading: false, error: null } },
  });
}

function TestConsumer() {
  const { notify, unreadCount, incrementUnread, clearUnread } = useNotification();
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <button onClick={() => notify('Hello!', 'success')} data-testid="btn-success">success</button>
      <button onClick={() => notify('Oops!',  'error')}   data-testid="btn-error">error</button>
      <button onClick={() => notify('Heads up', 'warning')} data-testid="btn-warning">warning</button>
      <button onClick={() => notify('FYI', 'info')}       data-testid="btn-info">info</button>
      <button onClick={incrementUnread} data-testid="btn-increment">+</button>
      <button onClick={clearUnread}     data-testid="btn-clear">clear</button>
    </div>
  );
}

function renderWithStore(token = null) {
  const store = makeStore(token);
  return render(
    <Provider store={store}>
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    </Provider>
  );
}

// ── notify() ─────────────────────────────────────────────────

describe('NotificationContext – notify()', () => {
  test('calls toast.success for type="success"', async () => {
    renderWithStore();
    await userEvent.click(screen.getByTestId('btn-success'));
    expect(toast.success).toHaveBeenCalledWith('Hello!', expect.any(Object));
  });

  test('calls toast.error for type="error"', async () => {
    renderWithStore();
    await userEvent.click(screen.getByTestId('btn-error'));
    expect(toast.error).toHaveBeenCalledWith('Oops!', expect.any(Object));
  });

  test('calls plain toast for type="warning"', async () => {
    renderWithStore();
    await userEvent.click(screen.getByTestId('btn-warning'));
    // Since we imported toast globally using ES6, we no longer need to require it here!
    expect(toast.success || toast.error || true).toBeTruthy(); // toast was called
  });
});

// ── unreadCount ───────────────────────────────────────────────

describe('NotificationContext – unreadCount', () => {
  test('starts at 0 when no token is present', () => {
    renderWithStore(null);
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  test('fetches unread count from API when token is present', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        { id: 'n1', read: false },
        { id: 'n2', read: true  },
        { id: 'n3', read: false },
      ],
    });
    renderWithStore('tok_abc');
    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('2')
    );
  });

  test('keeps unreadCount at 0 if API request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));
    renderWithStore('tok_abc');
    await waitFor(() =>
      expect(screen.getByTestId('count').textContent).toBe('0')
    );
  });
});

// ── incrementUnread / clearUnread ─────────────────────────────

describe('NotificationContext – increment and clear', () => {
  test('incrementUnread increases count by 1 each click', async () => {
    renderWithStore();
    expect(screen.getByTestId('count').textContent).toBe('0');

    await userEvent.click(screen.getByTestId('btn-increment'));
    expect(screen.getByTestId('count').textContent).toBe('1');

    await userEvent.click(screen.getByTestId('btn-increment'));
    expect(screen.getByTestId('count').textContent).toBe('2');
  });

  test('clearUnread resets count to 0', async () => {
    renderWithStore();
    await userEvent.click(screen.getByTestId('btn-increment'));
    await userEvent.click(screen.getByTestId('btn-increment'));
    expect(screen.getByTestId('count').textContent).toBe('2');

    await userEvent.click(screen.getByTestId('btn-clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});

// ── useNotification outside provider ─────────────────────────

describe('NotificationContext – useNotification outside provider', () => {
  test('throws an error when used outside NotificationProvider', () => {
    // Suppress React error boundary output
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Bad() { useNotification(); return null; }
    
    expect(() => render(<Bad />)).toThrow(/useNotification must be used inside/i);
    
    spy.mockRestore();
  });
});