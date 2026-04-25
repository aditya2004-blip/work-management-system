/**
 * ─────────────────────────────────────────────────────────────
 *  authSlice.test.js
 *  Unit tests for the auth Redux slice:
 *    • reducers  : logout, clearError, setUser
 *    • thunks    : loginUser, signupUser, fetchMe
 * ─────────────────────────────────────────────────────────────
 */
import authReducer, {
  loginUser,
  signupUser,
  fetchMe,
  logout,
  clearError,
  setUser,
} from '../../features/auth/authSlice';

// ── Mock the axios api module ────────────────────────────────
// Axios is mapped globally
import api from '../../api/axios';

// ── Helpers ──────────────────────────────────────────────────
const initialState = {
  user:    null,
  token:   null,
  loading: false,
  error:   null,
};

const mockUser = {
  uid:   'u1',
  name:  'Jane Doe',
  email: 'jane@example.com',
  role:  'manager',
};

const mockApiResponse = { token: 'tok_abc', user: mockUser };

// ── Synchronous reducer tests ─────────────────────────────────

describe('authSlice – synchronous reducers', () => {
  test('returns the correct initial state', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual({
      ...initialState,
      token: localStorage.getItem('token'), // null in test env
    });
  });

  test('logout clears user and token', () => {
    const loggedInState = { user: mockUser, token: 'tok_abc', loading: false, error: null };
    const next = authReducer(loggedInState, logout());
    expect(next.user).toBeNull();
    expect(next.token).toBeNull();
  });

  test('clearError sets error to null', () => {
    const errState = { ...initialState, error: 'Bad credentials' };
    expect(authReducer(errState, clearError()).error).toBeNull();
  });

  test('setUser stores the provided user object', () => {
    const next = authReducer(initialState, setUser(mockUser));
    expect(next.user).toEqual(mockUser);
  });
});

// ── loginUser thunk ───────────────────────────────────────────

describe('authSlice – loginUser thunk', () => {
  const credentials = { email: 'jane@example.com', password: 'secret' };

  test('sets loading=true when pending', () => {
    const next = authReducer(initialState, { type: loginUser.pending.type });
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  test('stores user and token on fulfilled', () => {
    const action = { type: loginUser.fulfilled.type, payload: mockApiResponse };
    const next   = authReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.user).toEqual(mockUser);
    expect(next.token).toBe('tok_abc');
  });

  test('stores error message on rejected', () => {
    const action = { type: loginUser.rejected.type, payload: 'Invalid credentials' };
    const next   = authReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.error).toBe('Invalid credentials');
  });

  test('dispatches fulfilled when API succeeds', async () => {
    api.post.mockResolvedValueOnce({ data: mockApiResponse });
    const dispatch = jest.fn();
    const thunk    = loginUser(credentials);
    await thunk(dispatch, () => ({}), undefined);

    const [pendingCall, fulfilledCall] = dispatch.mock.calls;
    expect(pendingCall[0].type).toBe(loginUser.pending.type);
    expect(fulfilledCall[0].type).toBe(loginUser.fulfilled.type);
    expect(fulfilledCall[0].payload).toEqual(mockApiResponse);
  });

  test('dispatches rejected when API fails', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Bad credentials' } },
    });
    const dispatch = jest.fn();
    await loginUser(credentials)(dispatch, () => ({}), undefined);

    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(loginUser.rejected.type);
    expect(lastCall.payload).toBe('Bad credentials');
  });

  test('falls back to default message when API returns no body', async () => {
    api.post.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await loginUser(credentials)(dispatch, () => ({}), undefined);

    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Login failed');
  });
});

// ── signupUser thunk ──────────────────────────────────────────

describe('authSlice – signupUser thunk', () => {
  const userData = { name: 'Jane', email: 'jane@example.com', password: 'secret', role: 'employee' };

  test('stores user and token on fulfilled', () => {
    const action = { type: signupUser.fulfilled.type, payload: mockApiResponse };
    const next   = authReducer(initialState, action);
    expect(next.user).toEqual(mockUser);
    expect(next.token).toBe('tok_abc');
  });

  test('dispatches fulfilled when API succeeds', async () => {
    api.post.mockResolvedValueOnce({ data: mockApiResponse });
    const dispatch = jest.fn();
    await signupUser(userData)(dispatch, () => ({}), undefined);

    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(signupUser.fulfilled.type);
  });

  test('dispatches rejected with default message on network error', async () => {
    api.post.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await signupUser(userData)(dispatch, () => ({}), undefined);

    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Signup failed');
  });
});

// ── fetchMe thunk ─────────────────────────────────────────────

describe('authSlice – fetchMe thunk', () => {
  test('sets only user (not token) on fulfilled', () => {
    const action = { type: fetchMe.fulfilled.type, payload: mockUser };
    const state  = { ...initialState, token: 'tok_abc' };
    const next   = authReducer(state, action);
    expect(next.user).toEqual(mockUser);
    expect(next.token).toBe('tok_abc'); // token unchanged
  });

  test('clears token on rejected (session expired)', () => {
    const state = { ...initialState, token: 'tok_abc' };
    const next  = authReducer(state, { type: fetchMe.rejected.type, payload: 'Session expired' });
    expect(next.token).toBeNull();
  });

  test('dispatches fulfilled when API succeeds', async () => {
    api.get.mockResolvedValueOnce({ data: mockUser });
    const dispatch = jest.fn();
    await fetchMe()(dispatch, () => ({}), undefined);

    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(fetchMe.fulfilled.type);
    expect(lastCall.payload).toEqual(mockUser);
  });
});
