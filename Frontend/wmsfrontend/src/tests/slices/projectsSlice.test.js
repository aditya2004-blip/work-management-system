/**
 * ─────────────────────────────────────────────────────────────
 *  projectsSlice.test.js
 *  Unit tests for the projects Redux slice:
 *    • synchronous reducers : projectAdded, projectUpdated, projectDeleted
 *    • async thunks         : fetchProjects, createProject, updateProject, deleteProject
 * ─────────────────────────────────────────────────────────────
 */
import projectsReducer, {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  projectAdded,
  projectUpdated,
  projectDeleted,
} from '../../features/projects/ProjectsSlice';

// Axios is mapped globally
import api from '../../api/axios';

// ── Fixtures ──────────────────────────────────────────────────
const initialState = { items: [], loading: false, error: null };

const proj1 = { id: 'p1', name: 'Alpha', status: 'active', description: 'First', members: ['u1'], createdAt: '2024-01-01T00:00:00.000Z' };
const proj2 = { id: 'p2', name: 'Beta',  status: 'active', description: 'Second', members: [],    createdAt: '2024-02-01T00:00:00.000Z' };

// ── Synchronous reducers ──────────────────────────────────────

describe('projectsSlice – synchronous reducers', () => {
  test('returns correct initial state', () => {
    expect(projectsReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  test('projectAdded prepends a new project', () => {
    const state = { ...initialState, items: [proj2] };
    const next  = projectsReducer(state, projectAdded(proj1));
    expect(next.items[0]).toEqual(proj1);
    expect(next.items).toHaveLength(2);
  });

  test('projectAdded is idempotent – does not add duplicates', () => {
    const state = { ...initialState, items: [proj1] };
    expect(projectsReducer(state, projectAdded(proj1)).items).toHaveLength(1);
  });

  test('projectUpdated merges fields into matching project', () => {
    const state = { ...initialState, items: [proj1, proj2] };
    const next  = projectsReducer(state, projectUpdated({ id: 'p1', status: 'completed' }));
    expect(next.items.find((p) => p.id === 'p1').status).toBe('completed');
    expect(next.items.find((p) => p.id === 'p2').status).toBe('active');
  });

  test('projectDeleted removes only the matching project', () => {
    const state = { ...initialState, items: [proj1, proj2] };
    const next  = projectsReducer(state, projectDeleted({ id: 'p1' }));
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('p2');
  });
});

// ── fetchProjects thunk ───────────────────────────────────────

describe('projectsSlice – fetchProjects thunk', () => {
  test('sets loading=true on pending', () => {
    const next = projectsReducer(initialState, { type: fetchProjects.pending.type });
    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  test('populates items on fulfilled', () => {
    const action = { type: fetchProjects.fulfilled.type, payload: [proj1, proj2] };
    const next   = projectsReducer(initialState, action);
    expect(next.loading).toBe(false);
    expect(next.items).toEqual([proj1, proj2]);
  });

  test('stores error on rejected', () => {
    const action = { type: fetchProjects.rejected.type, payload: 'Failed to fetch projects' };
    const next   = projectsReducer(initialState, action);
    expect(next.error).toBe('Failed to fetch projects');
  });

  test('dispatches fulfilled and calls GET /projects', async () => {
    api.get.mockResolvedValueOnce({ data: [proj1, proj2] });
    const dispatch = jest.fn();
    await fetchProjects()(dispatch, () => ({}), undefined);
    expect(api.get).toHaveBeenCalledWith('/projects');
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.type).toBe(fetchProjects.fulfilled.type);
  });
});

// ── createProject thunk ───────────────────────────────────────

describe('projectsSlice – createProject thunk', () => {
  const newProject = { name: 'Gamma', description: 'New', status: 'active', members: [] };

  test('prepends created project on fulfilled', () => {
    const action = { type: createProject.fulfilled.type, payload: proj1 };
    const next   = projectsReducer(initialState, action);
    expect(next.items[0]).toEqual(proj1);
  });

  test('calls POST /projects with data', async () => {
    api.post.mockResolvedValueOnce({ data: proj1 });
    const dispatch = jest.fn();
    await createProject(newProject)(dispatch, () => ({}), undefined);
    expect(api.post).toHaveBeenCalledWith('/projects', newProject);
  });

  test('dispatches rejected with custom message on API error', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Name taken' } } });
    const dispatch = jest.fn();
    await createProject(newProject)(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Name taken');
  });
});

// ── updateProject thunk ───────────────────────────────────────

describe('projectsSlice – updateProject thunk', () => {
  test('merges update on fulfilled', () => {
    const state  = { ...initialState, items: [proj1] };
    const action = { type: updateProject.fulfilled.type, payload: { id: 'p1', status: 'completed' } };
    const next   = projectsReducer(state, action);
    expect(next.items.find((p) => p.id === 'p1').status).toBe('completed');
  });

  test('calls PUT /projects/:id with updates', async () => {
    api.put.mockResolvedValueOnce({ data: { id: 'p1', status: 'completed' } });
    const dispatch = jest.fn();
    await updateProject({ id: 'p1', status: 'completed' })(dispatch, () => ({}), undefined);
    expect(api.put).toHaveBeenCalledWith('/projects/p1', { status: 'completed' });
  });
});

// ── deleteProject thunk ───────────────────────────────────────

describe('projectsSlice – deleteProject thunk', () => {
  test('removes project on fulfilled', () => {
    const state  = { ...initialState, items: [proj1, proj2] };
    const action = { type: deleteProject.fulfilled.type, payload: 'p1' };
    const next   = projectsReducer(state, action);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('p2');
  });

  test('calls DELETE /projects/:id', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    const dispatch = jest.fn();
    await deleteProject('p1')(dispatch, () => ({}), undefined);
    expect(api.delete).toHaveBeenCalledWith('/projects/p1');
  });

  test('dispatches rejected with fallback message on error', async () => {
    api.delete.mockRejectedValueOnce({});
    const dispatch = jest.fn();
    await deleteProject('p1')(dispatch, () => ({}), undefined);
    const lastCall = dispatch.mock.calls[dispatch.mock.calls.length - 1][0];
    expect(lastCall.payload).toBe('Failed to delete project');
  });
});
