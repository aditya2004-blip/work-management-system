/**
 * ─────────────────────────────────────────────────────────────
 *  tasksSlice.test.js
 *  Unit tests for the tasks Redux slice:
 *    • synchronous reducers : taskMoved, taskAdded, taskUpdated, taskRemoved
 *    • async thunks         : fetchTasks, createTask, updateTask, deleteTask
 * ─────────────────────────────────────────────────────────────
 */
import tasksReducer, {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  taskMoved,
  taskAdded,
  taskUpdated,
  taskRemoved,
} from '../../features/tasks/tasksSlice';

// Axios is mapped globally
import api from '../../api/axios';

// ── Fixtures ──────────────────────────────────────────────────
const initialState = { items: [], loading: false, error: null };

const task1 = {
  id: 't1', title: 'Fix auth bug', type: 'bug', priority: 'high',
  status: 'todo', projectId: 'p1', assigneeId: 'u1', comments: [],
};
const task2 = {
  id: 't2', title: 'New feature', type: 'feature', priority: 'medium',
  status: 'in-progress', projectId: 'p1', assigneeId: 'u2', comments: [],
};

// ── Synchronous reducers ──────────────────────────────────────

describe('tasksSlice – synchronous reducers', () => {
  test('returns correct initial state', () => {
    expect(tasksReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  test('taskMoved updates status of the matching task', () => {
    const state = { ...initialState, items: [task1, task2] };
    const next  = tasksReducer(state, taskMoved({ taskId: 't1', newStatus: 'in-progress' }));
    expect(next.items.find((t) => t.id === 't1').status).toBe('in-progress');
    expect(next.items.find((t) => t.id === 't2').status).toBe('in-progress'); // unchanged
  });

  test('taskMoved is a no-op when taskId does not exist', () => {
    const state = { ...initialState, items: [task1] };
    const next  = tasksReducer(state, taskMoved({ taskId: 'NOPE', newStatus: 'done' }));
    expect(next.items).toEqual(state.items);
  });

  test('taskAdded prepends a new task', () => {
    const state = { ...initialState, items: [task2] };
    const next  = tasksReducer(state, taskAdded(task1));
    expect(next.items[0]).toEqual(task1);
    expect(next.items).toHaveLength(2);
  });

  test('taskAdded is idempotent – duplicate id is NOT added again', () => {
    const state = { ...initialState, items: [task1] };
    const next  = tasksReducer(state, taskAdded(task1));
    expect(next.items).toHaveLength(1);
  });

  test('taskUpdated merges fields into the matching task', () => {
    const state = { ...initialState, items: [task1] };
    const next  = tasksReducer(state, taskUpdated({ id: 't1', status: 'done' }));
    expect(next.items.find((t) => t.id === 't1').status).toBe('done');
    expect(next.items.find((t) => t.id === 't1').title).toBe(task1.title);
  });

  test('taskRemoved removes only the matching task', () => {
    const state = { ...initialState, items: [task1, task2] };
    const next  = tasksReducer(state, taskRemoved({ id: 't1' }));
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('t2');
  });
});

// ── fetchTasks thunk ──────────────────────────────────────────

describe('tasksSlice – fetchTasks thunk', () => {
  test('sets loading=true on pending', () => {
    const next = tasksReducer(initialState, { type: fetchTasks.pending.type });
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  test('populates items and clears loading on fulfilled', () => {
    const action = { type: fetchTasks.fulfilled.type, payload: [task1, task2] };
    const next   = tasksReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.items).toEqual([task1, task2]);
  });

  test('stores error and clears loading on rejected', () => {
    const action = { type: fetchTasks.rejected.type, payload: 'Failed to fetch tasks' };
    const next   = tasksReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.error).toBe('Failed to fetch tasks');
  });

  test('dispatches fulfilled with project-filtered tasks', async () => {
    api.get.mockResolvedValueOnce({ data: [task1] });
    const dispatch = jest.fn();
    await fetchTasks('p1')(dispatch, () => ({}), undefined);

    expect(api.get).toHaveBeenCalledWith('/tasks', { params: { projectId: 'p1' } });
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(fetchTasks.fulfilled.type);
    expect(lastCall.payload).toEqual([task1]);
  });

  test('dispatches fulfilled with no params when projectId is undefined', async () => {
    api.get.mockResolvedValueOnce({ data: [task1, task2] });
    const dispatch = jest.fn();
    await fetchTasks(undefined)(dispatch, () => ({}), undefined);

    expect(api.get).toHaveBeenCalledWith('/tasks', { params: {} });
  });
});

// ── createTask thunk ──────────────────────────────────────────

describe('tasksSlice – createTask thunk', () => {
  const newTaskPayload = { title: 'New Task', type: 'feature', priority: 'low', status: 'todo' };

  test('prepends the new task on fulfilled', () => {
    const state  = { ...initialState, items: [task2] };
    const action = { type: createTask.fulfilled.type, payload: task1 };
    const next   = tasksReducer(state, action);
    expect(next.items[0]).toEqual(task1);
  });

  test('does not add duplicate task on fulfilled', () => {
    const state  = { ...initialState, items: [task1] };
    const action = { type: createTask.fulfilled.type, payload: task1 };
    expect(tasksReducer(state, action).items).toHaveLength(1);
  });

  test('calls POST /tasks with payload', async () => {
    api.post.mockResolvedValueOnce({ data: task1 });
    const dispatch = jest.fn();
    await createTask(newTaskPayload)(dispatch, () => ({}), undefined);
    expect(api.post).toHaveBeenCalledWith('/tasks', newTaskPayload);
  });
});

// ── updateTask thunk ──────────────────────────────────────────

describe('tasksSlice – updateTask thunk', () => {
  test('merges updated fields on fulfilled', () => {
    const state  = { ...initialState, items: [task1] };
    const action = { type: updateTask.fulfilled.type, payload: { id: 't1', status: 'review' } };
    const next   = tasksReducer(state, action);
    expect(next.items.find((t) => t.id === 't1').status).toBe('review');
  });

  test('calls PUT /tasks/:id with updates (excluding id)', async () => {
    api.put.mockResolvedValueOnce({ data: { id: 't1', status: 'done' } });
    const dispatch = jest.fn();
    await updateTask({ id: 't1', status: 'done' })(dispatch, () => ({}), undefined);
    expect(api.put).toHaveBeenCalledWith('/tasks/t1', { status: 'done' });
  });
});

// ── deleteTask thunk ──────────────────────────────────────────

describe('tasksSlice – deleteTask thunk', () => {
  test('removes the task on fulfilled', () => {
    const state  = { ...initialState, items: [task1, task2] };
    const action = { type: deleteTask.fulfilled.type, payload: 't1' };
    const next   = tasksReducer(state, action);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('t2');
  });

  test('calls DELETE /tasks/:id', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    const dispatch = jest.fn();
    await deleteTask('t1')(dispatch, () => ({}), undefined);
    expect(api.delete).toHaveBeenCalledWith('/tasks/t1');
  });

  test('dispatches rejected with default message on error', async () => {
    api.delete.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await deleteTask('t1')(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Failed to delete task');
  });
});
