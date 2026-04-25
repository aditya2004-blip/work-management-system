/**
 * ─────────────────────────────────────────────────────────────
 * TaskForm.test.jsx
 * Tests for the <TaskForm /> component covering:
 * • Renders all fields correctly
 * • Project locked vs. unlocked mode
 * • Employee: assignee field is read-only
 * • Manager/Admin: assignee is a select
 * • Validation (title min-length)
 * • Create mode: dispatches createTask on valid submit
 * • Edit mode: pre-fills fields and dispatches updateTask
 * • Success callback invoked on fulfilled
 * • Error notification shown on rejected
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import TaskForm from '../../features/tasks/TaskForm';

// 1. Replaced require() with standard ES6 imports
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

// ── Fixtures ──────────────────────────────────────────────────
const adminUser = { uid: 'admin-1', name: 'Admin', email: 'a@t.com', role: 'admin' };
const employeeUser = { uid: 'emp-1', name: 'Bob', email: 'b@t.com', role: 'employee' };
const projectList = [{ id: 'p1', name: 'Alpha Project', status: 'active', members: [], createdAt: '' }];
const userList = [adminUser, { uid: 'u2', name: 'Charlie', email: 'c@t.com', role: 'manager' }];

const existingTask = {
  id: 't1',
  title: 'Existing task',
  description: 'Desc',
  type: 'bug',
  priority: 'high',
  status: 'in-progress',
  projectId: 'p1',
  assigneeId: 'u2',
  dueDate: '2025-01-15',
  comments: [],
};

// ── Helpers ───────────────────────────────────────────────────
function renderAsAdmin(props = {}) {
  return renderWithProviders(<TaskForm onSuccess={jest.fn()} {...props} />, {
    preloadedState: {
      auth: { user: adminUser, token: 'tok', loading: false, error: null },
      users: { items: userList, loading: false, error: null },
      projects: { items: projectList, loading: false, error: null },
      tasks: { items: [], loading: false, error: null },
    },
  });
}

function renderAsEmployee(props = {}) {
  return renderWithProviders(<TaskForm onSuccess={jest.fn()} {...props} />, {
    preloadedState: {
      auth: { user: employeeUser, token: 'tok', loading: false, error: null },
      users: { items: [], loading: false, error: null },
      projects: { items: projectList, loading: false, error: null },
      tasks: { items: [], loading: false, error: null },
    },
  });
}

// ── Rendering ─────────────────────────────────────────────────

describe('TaskForm – rendering (admin)', () => {
  test('renders title input', () => {
    renderAsAdmin();
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument();
  });

  test('renders description textarea', () => {
    renderAsAdmin();
    expect(screen.getByPlaceholderText(/details/i)).toBeInTheDocument();
  });

  test('renders type, priority, status selects', () => {
    renderAsAdmin();
    expect(screen.getByText(/type/i)).toBeInTheDocument();
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();
  });

  test('renders "Create task" submit button in create mode', () => {
    renderAsAdmin();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  test('renders "Save changes" submit button in edit mode', () => {
    renderAsAdmin({ task: existingTask });
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});

// ── Project field ─────────────────────────────────────────────

describe('TaskForm – project field', () => {
  test('shows project as read-only when projectId prop is locked', () => {
    renderAsAdmin({ projectId: 'p1' });
    // Should NOT render a select for project – shows the name as static text
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
  });

  test('shows project as a select when no projectId prop', () => {
    renderAsAdmin();
    // The select contains "No project" option
    expect(screen.getByText(/no project/i)).toBeInTheDocument();
  });
});

// ── Employee restrictions ─────────────────────────────────────

describe('TaskForm – employee restrictions', () => {
  test('assignee field is read-only for employees', () => {
    renderAsEmployee({ task: existingTask });
    // Employee sees a static div, not a <select>
    expect(screen.queryByRole('combobox', { name: /assignee/i })).not.toBeInTheDocument();
  });
});

// ── Validation ────────────────────────────────────────────────

describe('TaskForm – validation', () => {
  test('shows title required error when submitted with empty title', async () => {
    renderAsAdmin();
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));
    await waitFor(() => expect(screen.getByText(/title must be at least 2 characters/i)).toBeInTheDocument());
  });
});

// ── Create task ───────────────────────────────────────────────

describe('TaskForm – create task', () => {
  test('calls POST /tasks and invokes onSuccess on success', async () => {
    const onSuccess = jest.fn();
    api.post.mockResolvedValueOnce({
      data: { id: 't_new', title: 'New task', status: 'todo' },
    });
    renderAsAdmin({ onSuccess });

    await userEvent.type(screen.getByPlaceholderText(/task title/i), 'New task');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/tasks', expect.objectContaining({ title: 'New task' }));
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('shows error notification when createTask is rejected', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Server error' } } });
    renderAsAdmin();

    await userEvent.type(screen.getByPlaceholderText(/task title/i), 'Bad task');
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/server error/i), expect.any(Object))
    );
  });
});

// ── Edit task (pre-fill) ──────────────────────────────────────

describe('TaskForm – edit task mode', () => {
  test('pre-fills title from existing task', () => {
    renderAsAdmin({ task: existingTask });
    expect(screen.getByPlaceholderText(/task title/i)).toHaveValue('Existing task');
  });

  test('pre-fills description from existing task', () => {
    renderAsAdmin({ task: existingTask });
    expect(screen.getByPlaceholderText(/details/i)).toHaveValue('Desc');
  });

  test('calls PUT /tasks/:id and invokes onSuccess on save', async () => {
    const onSuccess = jest.fn();
    api.put.mockResolvedValueOnce({ data: { ...existingTask, title: 'Updated' } });
    renderAsAdmin({ task: existingTask, onSuccess });

    // Clear and re-type title
    const titleInput = screen.getByPlaceholderText(/task title/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated');
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/tasks/t1', expect.objectContaining({ title: 'Updated' }));
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});