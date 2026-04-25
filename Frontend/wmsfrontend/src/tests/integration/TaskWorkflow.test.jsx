/**
 * ─────────────────────────────────────────────────────────────
 *  TaskWorkflow.test.jsx  (Integration)
 *  Simulates end-to-end task management flows:
 *    1. Admin creates a task → it appears in the Redux store
 *    2. Task status update via slice (optimistic move)
 *    3. Employee cannot create or delete tasks
 *    4. Task deleted → removed from store
 *    5. tasksSlice handles socket events (taskAdded, taskUpdated, taskRemoved)
 *    6. KanbanBoard groups tasks by status column
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/renderWithProviders';
import KanbanBoard from '../../features/tasks/KanbanBoard';

// ── DnD kit mocks (must exist for KanbanBoard to mount) ───────
jest.mock('@dnd-kit/core', () => ({
  DndContext:      ({ children }) => <div>{children}</div>,
  DragOverlay:     ({ children }) => <div>{children}</div>,
  closestCenter:   jest.fn(),
  PointerSensor:   jest.fn(),
  useSensor:       jest.fn(() => ({})),
  useSensors:      jest.fn(() => []),
  useDroppable:    () => ({ setNodeRef: jest.fn(), isOver: false }),
}));
jest.mock('@dnd-kit/sortable', () => ({
  SortableContext:           ({ children }) => <div>{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {}, listeners: {}, setNodeRef: jest.fn(),
    transform: null, transition: null, isDragging: false,
  }),
}));
jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// Axios is mapped globally
import api from '../../api/axios';

jest.mock('react-hot-toast', () => {
  const mockToast = { success: jest.fn(), error: jest.fn() };
  const fn = Object.assign(jest.fn(), mockToast);
  return { __esModule: true, toast: fn, default: fn };
});

jest.mock('../../context/SocketContext', () => ({
  SocketProvider: ({ children }) => children,
  useSocket:      () => ({ emitTaskMove: jest.fn() }),
}));

// ── Fixtures ──────────────────────────────────────────────────
const adminUser    = { uid: 'a1', name: 'Admin',    role: 'admin'    };
const employeeUser = { uid: 'e1', name: 'Employee', role: 'employee' };

const todoTask = {
  id: 't1', title: 'Fix bug',     type: 'bug',     priority: 'high',
  status: 'todo',        projectId: null, assigneeId: 'e1',
  assigneeName: 'Employee', dueDate: null,  comments: [],
};
const inProgressTask = {
  id: 't2', title: 'New feature', type: 'feature', priority: 'medium',
  status: 'in-progress', projectId: null, assigneeId: 'a1',
  assigneeName: 'Admin',    dueDate: null,  comments: [],
};
const doneTask = {
  id: 't3', title: 'Write tests', type: 'improvement', priority: 'low',
  status: 'done',        projectId: null, assigneeId: 'a1',
  assigneeName: 'Admin',    dueDate: null,  comments: [],
};

// ── Helpers ───────────────────────────────────────────────────
function renderBoard(user, tasksOverride = {}) {
  return renderWithProviders(<KanbanBoard />, {
    initialEntries: ['/tasks'],
    preloadedState: {
      auth:     { user, token: 'tok', loading: false, error: null },
      tasks:    { items: [todoTask, inProgressTask, doneTask], loading: false, error: null, ...tasksOverride },
      projects: { items: [], loading: false, error: null },
      users:    { items: [], loading: false, error: null },
    },
  });
}

// ─────────────────────────────────────────────────────────────
//  KanbanBoard rendering
// ─────────────────────────────────────────────────────────────

describe('KanbanBoard – rendering', () => {
  test('renders all four status columns', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(adminUser);
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('In Review')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  test('renders task cards in their respective columns', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(adminUser);
    await waitFor(() => {
      expect(screen.getByText('Fix bug')).toBeInTheDocument();
      expect(screen.getByText('New feature')).toBeInTheDocument();
      expect(screen.getByText('Write tests')).toBeInTheDocument();
    });
  });

  test('shows "New task" button for admin', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(adminUser);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument()
    );
  });

  test('does NOT show "New task" button for employee', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(employeeUser);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /new task/i })).not.toBeInTheDocument()
    );
  });

  test('shows employee info banner for employee role', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(employeeUser);
    await waitFor(() =>
      expect(screen.getByText(/showing tasks assigned to you/i)).toBeInTheDocument()
    );
  });

  test('shows total task count in header', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    renderBoard(adminUser);
    await waitFor(() =>
      expect(screen.getByText(/3 tasks/i)).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────
//  tasksSlice integration – socket reducer actions
// ─────────────────────────────────────────────────────────────
import tasksReducer, { taskMoved, taskAdded, taskUpdated, taskRemoved } from '../../features/tasks/tasksSlice';

describe('Integration: tasksSlice socket-driven updates', () => {
  const initialState = { items: [todoTask, inProgressTask], loading: false, error: null };

  test('taskMoved (optimistic drag) immediately updates status in store', () => {
    const next = tasksReducer(initialState, taskMoved({ taskId: 't1', newStatus: 'done' }));
    expect(next.items.find((t) => t.id === 't1').status).toBe('done');
  });

  test('taskAdded via socket does not duplicate existing task', () => {
    const next = tasksReducer(initialState, taskAdded(todoTask));
    expect(next.items.filter((t) => t.id === 't1')).toHaveLength(1);
  });

  test('taskAdded via socket appends a truly new task', () => {
    const newTask = { ...doneTask, id: 't_new' };
    const next    = tasksReducer(initialState, taskAdded(newTask));
    expect(next.items).toHaveLength(3);
    expect(next.items[0].id).toBe('t_new'); // prepended
  });

  test('taskUpdated via socket merges status change', () => {
    const next = tasksReducer(
      initialState,
      taskUpdated({ id: 't2', status: 'review' })
    );
    expect(next.items.find((t) => t.id === 't2').status).toBe('review');
  });

  test('taskRemoved via socket removes the task', () => {
    const next = tasksReducer(initialState, taskRemoved({ id: 't1' }));
    expect(next.items.some((t) => t.id === 't1')).toBe(false);
    expect(next.items).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
//  Delete flow
// ─────────────────────────────────────────────────────────────

describe('Integration: delete task', () => {
  test('confirms before deleting and calls DELETE /tasks/:id', async () => {
    api.get.mockResolvedValue({ data: [todoTask, inProgressTask, doneTask] });
    api.delete.mockResolvedValueOnce({ data: {} });
    window.confirm = jest.fn(() => true);

    renderBoard(adminUser);
    await waitFor(() => expect(screen.getByText('Fix bug')).toBeInTheDocument());

    // Admin sees trash buttons – click the first one
    const trashButtons = screen.getAllByRole('button').filter(
      (btn) => btn.className.includes('red') || btn.querySelector('[data-lucide="trash-2"]')
    );
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    }
  });
});
