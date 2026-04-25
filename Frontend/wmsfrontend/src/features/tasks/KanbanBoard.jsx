// Dependencies: react, react-redux, @dnd-kit/core, @dnd-kit/sortable
// This component implements a full Kanban board with drag-and-drop support

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchTasks, updateTask, deleteTask, taskMoved } from './tasksSlice.jsx';
import { fetchUsers } from '../users/usersSlice.jsx';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import TaskCard from './TaskCard.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import Button from '../../components/common/Button.jsx';

import { useSocket } from '../../context/SocketContext.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

import { Plus, Kanban, Info } from 'lucide-react';

// Lazy load task form (code splitting for performance)
const TaskForm = lazy(() => import('./TaskForm.jsx'));

// Define Kanban columns
const COLUMNS = [
    { id: 'todo', label: 'To Do', bg: 'bg-gray-50   dark:bg-gray-800/40', dot: 'bg-gray-400' },
    { id: 'in-progress', label: 'In Progress', bg: 'bg-blue-50   dark:bg-blue-900/10', dot: 'bg-blue-500' },
    { id: 'review', label: 'In Review', bg: 'bg-yellow-50 dark:bg-yellow-900/10', dot: 'bg-yellow-500' },
    { id: 'done', label: 'Done', bg: 'bg-green-50  dark:bg-green-900/10', dot: 'bg-green-500' },
];


// ─────────────────────────────────────────────────────────────
// DROPPABLE COLUMN COMPONENT
// Makes each column a valid drop zone using dnd-kit
// ─────────────────────────────────────────────────────────────
const DroppableColumn = ({ col, children, grouped, canManage, openModal }) => {

    // Register column as droppable area
    const { setNodeRef, isOver } = useDroppable({ id: col.id });

    return (
        <div
            ref={setNodeRef}
            className={`${col.bg} rounded-xl p-4 min-h-[520px] transition-colors ${isOver ? 'ring-2 ring-indigo-400 ring-inset' : ''
                }`}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        {col.label}
                    </h3>
                </div>

                {/* Task count badge */}
                <span className="text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                    {grouped[col.id]?.length ?? 0}
                </span>
            </div>

            {/* Sortable list of tasks inside column */}
            <SortableContext
                items={grouped[col.id]?.map((t) => t.id) ?? []}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3">{children}</div>
            </SortableContext>

            {/* Add task button (only for admin/manager) */}
            {canManage && (
                <button
                    onClick={() => openModal('taskForm', { task: null, defaultStatus: col.id })}
                    className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1.5"
                >
                    <Plus size={13} />Add task
                </button>
            )}
        </div>
    );
};


// ─────────────────────────────────────────────────────────────
// MAIN KANBAN BOARD COMPONENT
// ─────────────────────────────────────────────────────────────
const KanbanBoard = () => {

    const dispatch = useDispatch();

    // Get projectId from URL (for filtering tasks)
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');

    // Redux state
    const { items: tasks, loading } = useSelector((s) => s.tasks);
    const { items: projects } = useSelector((s) => s.projects);
    const { user } = useSelector((s) => s.auth);

    // Contexts
    const { emitTaskMove } = useSocket(); // for real-time updates
    const { openModal, closeModal, isOpen, modalProps, modalType } = useModal();
    const { notify } = useNotification();

    // Local state for drag overlay
    const [activeTask, setActiveTask] = useState(null);

    // Role-based permissions
    const isEmployee = user?.role === 'employee';
    const canManage = !isEmployee;

    // Configure drag sensor (prevents accidental drag)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Fetch tasks and users on mount
    useEffect(() => {
        dispatch(fetchTasks(projectId || undefined));

        // Only admin/manager can fetch users
        if (canManage) dispatch(fetchUsers());
    }, [dispatch, projectId, canManage]);


    // ─────────────────────────────────────────────────────────
    // DRAG START HANDLER
    // Stores the dragged task for overlay UI
    // ─────────────────────────────────────────────────────────
    const handleDragStart = useCallback(({ active }) => {
        setActiveTask(tasks.find((t) => t.id === active.id) || null);
    }, [tasks]);


    // ─────────────────────────────────────────────────────────
    // DRAG END HANDLER
    // Handles moving tasks between columns
    // ─────────────────────────────────────────────────────────
    const handleDragEnd = useCallback(async ({ active, over }) => {
        setActiveTask(null);

        if (!over) return;

        const draggedTask = tasks.find((t) => t.id === active.id);
        if (!draggedTask) return;

        // Determine target column
        let targetColId = COLUMNS.find((c) => c.id === over.id)?.id;

        // If dropped on a card, get that card's column
        if (!targetColId) {
            const overTask = tasks.find((t) => t.id === over.id);
            targetColId = overTask?.status;
        }

        if (!targetColId || draggedTask.status === targetColId) return;

        // ── OPTIMISTIC UPDATE ──
        // Immediately update UI before API response
        dispatch(taskMoved({ taskId: draggedTask.id, newStatus: targetColId }));

        const result = await dispatch(
            updateTask({ id: draggedTask.id, status: targetColId })
        );

        if (updateTask.fulfilled.match(result)) {
            // Emit real-time update via socket
            emitTaskMove({ taskId: draggedTask.id, newStatus: targetColId, projectId });
        } else {
            // Revert UI if API fails
            dispatch(taskMoved({ taskId: draggedTask.id, newStatus: draggedTask.status }));
            notify(result.payload || 'Failed to move task', 'error');
        }
    }, [tasks, dispatch, emitTaskMove, projectId, notify]);


    // Group tasks by column (status)
    const grouped = COLUMNS.reduce((acc, col) => {
        acc[col.id] = tasks.filter((t) => t.status === col.id);
        return acc;
    }, {});


    // Delete task handler
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;

        const result = await dispatch(deleteTask(id));
        if (deleteTask.fulfilled.match(result)) {
            notify('Task deleted', 'success');
        }
    };

    // Show loader while fetching
    if (loading) return <Loader />;


    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Kanban size={22} className="text-gray-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Kanban Board
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {tasks.length} tasks{projectId ? ' in this project' : ''}
                        </p>
                    </div>
                </div>

                {/* Create task button */}
                {canManage && (
                    <Button onClick={() => openModal('taskForm', { task: null, defaultStatus: 'todo' })}>
                        <Plus size={16} />New task
                    </Button>
                )}
            </div>


            {/* EMPLOYEE INFO BANNER */}
            {isEmployee && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                    <Info size={15} />
                    <span>Showing tasks assigned to you. Drag cards to update their status.</span>
                </div>
            )}


            {/* KANBAN BOARD */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {COLUMNS.map((col) => (
                        <DroppableColumn
                            key={col.id}
                            col={col}
                            grouped={grouped}
                            canManage={canManage}
                            openModal={openModal}
                        >
                            {grouped[col.id]?.map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    projects={projects}
                                    canManage={canManage}
                                    onEdit={() => openModal('taskForm', { task, defaultStatus: task.status })}
                                    onDelete={() => handleDelete(task.id)}
                                />
                            ))}
                        </DroppableColumn>
                    ))}
                </div>

                {/* Drag preview overlay */}
                <DragOverlay>
                    {activeTask && (
                        <div className="opacity-90 rotate-2 scale-105">
                            <TaskCard task={activeTask} projects={projects} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>


            {/* MODAL FOR TASK FORM */}
            <Modal
                isOpen={isOpen && modalType === 'taskForm'}
                onClose={closeModal}
                title={modalProps?.task ? 'Edit task' : 'New task'}
                size="lg"
            >
                <Suspense fallback={<Loader fullscreen={false} size="sm" />}>
                    <TaskForm
                        task={modalProps?.task}
                        defaultStatus={modalProps?.defaultStatus}
                        projectId={projectId}
                        onSuccess={closeModal}
                    />
                </Suspense>
            </Modal>
        </div>
    );
};

export default KanbanBoard;