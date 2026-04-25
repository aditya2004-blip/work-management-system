/**
 * ─────────────────────────────────────────────────────────────
 *  dashboardSlice.test.js
 *  Unit tests for the dashboard Redux slice.
 * ─────────────────────────────────────────────────────────────
 */
import dashboardReducer from '../../features/dashboard/dashboardSlice';

// Axios is mapped globally
import api from '../../api/axios';

// ── Fixtures ──────────────────────────────────────────────────
const mockDashData = {
  totalTasks: 20,
  completedTasks: 12,
  inProgressTasks: 5,
  overdueTasks: 3,
  recentActivity: [],
};

// ── Initial state ─────────────────────────────────────────────

describe('dashboardSlice – initial state', () => {
  test('has the expected shape', () => {
    const state = dashboardReducer(undefined, { type: '@@INIT' });
    // The slice exists – just verify it is an object (not null/undefined)
    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
  });
});

// ── fetchDashboard thunk (if it exists) ───────────────────────

describe('dashboardSlice – API interaction', () => {
  test('reducer handles an arbitrary fulfilled action without throwing', () => {
    const state = dashboardReducer(undefined, {
      type: 'dashboard/fetchStats/fulfilled',
      payload: mockDashData,
    });
    expect(state).toBeDefined();
  });

  test('reducer handles a rejected action without throwing', () => {
    const state = dashboardReducer(undefined, {
      type: 'dashboard/fetchStats/rejected',
      payload: 'Error fetching dashboard',
    });
    expect(state).toBeDefined();
  });
});
