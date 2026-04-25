/**
 * ─────────────────────────────────────────────────────────────
 * TaskCard.test.jsx
 * Tests for the <TaskCard /> component covering:
 * • Renders task title, description, badges
 * • Shows edit/delete buttons only when canManage=true
 * • Hides edit/delete buttons for employees (canManage=false)
 * • Shows overdue indicator when past due date
 * • Shows comment count
 * • Shows project name badge when projectId matches
 * • Calls onEdit / onDelete handlers
 * ─────────────────────────────────────────────────────────────
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../features/tasks/TaskCard';

// ── @dnd-kit must be mocked so drag-and-drop doesn't crash in jsdom ───────────
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// ── Fixtures ──────────────────────────────────────────────────
const baseTask = {
  id: 't1',
  title: 'Fix the auth bug',
  description: 'JWT token expiry is miscalculated.',
  type: 'bug',
  priority: 'high',
  status: 'todo',
  projectId: 'p1',
  assigneeId: 'u1',
  assigneeName: 'Alice',
  dueDate: null,
  comments: [],
};

const projects = [{ id: 'p1', name: 'Alpha Project' }];

// ── Rendering ─────────────────────────────────────────────────

describe('TaskCard – rendering', () => {
  test('renders task title', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText('Fix the auth bug')).toBeInTheDocument();
  });

  test('renders task description', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText(/JWT token expiry/i)).toBeInTheDocument();
  });

  test('renders type and priority badges', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  test('renders project name badge when projectId matches', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
  });

  test('does not render project badge when projects list is empty', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={[]} />);
    expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
  });

  test('renders assignee name', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  test('does not render description when it is absent', () => {
    const task = { ...baseTask, description: undefined };
    render(<TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.queryByText(/JWT token/i)).not.toBeInTheDocument();
  });
});

// ── Role-based buttons ────────────────────────────────────────

describe('TaskCard – role-based controls', () => {
  test('renders edit and delete buttons when canManage=true', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage={true} projects={projects} />);
    // Pencil (edit) and Trash2 (delete) icons are inside buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  test('hides edit/delete buttons when canManage=false (employee view)', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage={false} projects={projects} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

// ── Action handlers ───────────────────────────────────────────

describe('TaskCard – action handlers', () => {
  test('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<TaskCard task={baseTask} onEdit={onEdit} onDelete={jest.fn()} canManage projects={projects} />);
    const [editBtn] = screen.getAllByRole('button');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={onDelete} canManage projects={projects} />);
    const [, deleteBtn] = screen.getAllByRole('button');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

// ── Due date & overdue ────────────────────────────────────────

describe('TaskCard – due date display', () => {
  test('renders due date when present', () => {
    const task = { ...baseTask, dueDate: '2099-12-31' };
    render(<TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText(/dec 31/i)).toBeInTheDocument();
  });

  test('applies overdue styling for past due tasks not yet done', () => {
    const task = { ...baseTask, dueDate: '2000-01-01', status: 'todo' };
    const { container } = render(
      <TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />
    );
    // The overdue date span should have text-red-500 class
    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });

  test('does NOT apply overdue styling for done tasks', () => {
    const task = { ...baseTask, dueDate: '2000-01-01', status: 'done' };
    const { container } = render(
      <TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />
    );
    expect(container.querySelector('.text-red-500')).not.toBeInTheDocument();
  });
});

// ── Comments count ────────────────────────────────────────────

describe('TaskCard – comment count', () => {
  test('shows comment count when comments exist', () => {
    const task = {
      ...baseTask,
      comments: [{ id: 'c1', text: 'LGTM' }, { id: 'c2', text: 'Good' }],
    };
    render(<TaskCard task={task} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('hides comment count when there are no comments', () => {
    render(<TaskCard task={baseTask} onEdit={jest.fn()} onDelete={jest.fn()} canManage projects={projects} />);
    // '0' should not appear as the comment count
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});