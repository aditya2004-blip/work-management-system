/**
 * ─────────────────────────────────────────────────────────────
 *  usersSlice.test.js
 *  Unit tests for the users Redux slice:
 *    • async thunks : fetchUsers, updateUser, deleteUser
 * ─────────────────────────────────────────────────────────────
 */
import usersReducer, {
  fetchUsers,
  updateUser,
  deleteUser,
} from '../../features/users/usersSlice';

// Axios is mapped globally
import api from '../../api/axios';

// ── Fixtures ──────────────────────────────────────────────────
const initialState = { items: [], loading: false, error: null };

const user1 = { uid: 'u1', name: 'Alice', email: 'alice@test.com', role: 'manager',  status: 'active' };
const user2 = { uid: 'u2', name: 'Bob',   email: 'bob@test.com',   role: 'employee', status: 'active' };

// ── Initial state ─────────────────────────────────────────────

describe('usersSlice – initial state', () => {
  test('returns correct initial state', () => {
    expect(usersReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });
});

// ── fetchUsers thunk ──────────────────────────────────────────

describe('usersSlice – fetchUsers thunk', () => {
  test('sets loading=true on pending', () => {
    const next = usersReducer(initialState, { type: fetchUsers.pending.type });
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  test('populates items on fulfilled', () => {
    const action = { type: fetchUsers.fulfilled.type, payload: [user1, user2] };
    const next   = usersReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.items).toEqual([user1, user2]);
  });

  test('sets error on rejected', () => {
    const action = { type: fetchUsers.rejected.type, payload: 'Failed to fetch users' };
    const next   = usersReducer(initialState, action);
    expect(next.error).toBe('Failed to fetch users');
  });

  test('dispatches fulfilled and calls GET /users', async () => {
    api.get.mockResolvedValueOnce({ data: [user1, user2] });
    const dispatch = jest.fn();
    await fetchUsers()(dispatch, () => ({}), undefined);
    expect(api.get).toHaveBeenCalledWith('/users');
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(fetchUsers.fulfilled.type);
  });

  test('dispatches rejected with fallback message on error', async () => {
    api.get.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await fetchUsers()(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Failed to fetch users');
  });
});

// ── updateUser thunk ──────────────────────────────────────────

describe('usersSlice – updateUser thunk', () => {
  test('merges updated fields on fulfilled', () => {
    const state  = { ...initialState, items: [user1, user2] };
    const action = { type: updateUser.fulfilled.type, payload: { id: 'u1', role: 'admin' } };
    const next   = usersReducer(state, action);
    // finds by uid === payload.id
    expect(next.items.find((u) => u.uid === 'u1').role).toBe('admin');
    expect(next.items.find((u) => u.uid === 'u2').role).toBe('employee');
  });

  test('calls PUT /users/:id with updates', async () => {
    api.put.mockResolvedValueOnce({ data: {} });
    const dispatch = jest.fn();
    await updateUser({ id: 'u1', role: 'admin' })(dispatch, () => ({}), undefined);
    expect(api.put).toHaveBeenCalledWith('/users/u1', { role: 'admin' });
  });

  test('dispatches rejected on API error', async () => {
    api.put.mockRejectedValueOnce({ response: { data: { message: 'Not allowed' } } });
    const dispatch = jest.fn();
    await updateUser({ id: 'u1', role: 'admin' })(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Not allowed');
  });
});

// ── deleteUser thunk ──────────────────────────────────────────

describe('usersSlice – deleteUser thunk', () => {
  test('removes user by uid on fulfilled', () => {
    const state  = { ...initialState, items: [user1, user2] };
    const action = { type: deleteUser.fulfilled.type, payload: 'u1' };
    const next   = usersReducer(state, action);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].uid).toBe('u2');
  });

  test('calls DELETE /users/:id', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    const dispatch = jest.fn();
    await deleteUser('u1')(dispatch, () => ({}), undefined);
    expect(api.delete).toHaveBeenCalledWith('/users/u1');
  });

  test('dispatches rejected with fallback message on error', async () => {
    api.delete.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await deleteUser('u1')(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Failed to delete user');
  });
});
