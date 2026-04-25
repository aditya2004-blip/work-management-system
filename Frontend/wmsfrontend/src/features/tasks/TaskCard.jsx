// TaskCard Component
// Represents a draggable task item inside the Kanban board

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2, MessageCircle, Calendar, User, FolderOpen } from 'lucide-react';
import Badge from '../../components/common/Badge';

const TaskCard = ({ task, onEdit, onDelete, canManage, projects = [] }) => {

    // Enable drag-and-drop sorting using dnd-kit
    const {
        attributes,     // accessibility + drag attributes
        listeners,      // event listeners for drag
        setNodeRef,     // ref to attach draggable element
        transform,      // transform style during drag
        transition,     // animation transition
        isDragging      // boolean if currently dragging
    } = useSortable({ id: task.id });

    // Apply drag styles dynamically
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1 // reduce opacity while dragging
    };

    // Check if task is overdue
    const isOverdue =
        task.dueDate &&
        task.status !== 'done' &&
        new Date(task.dueDate) < new Date();

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all select-none"
        >

            {/* ───────── HEADER ───────── */}
            <div className="flex items-start gap-2 mb-2">

                {/* Task title */}
                <h4 className="text-sm font-medium text-gray-900 dark:text-white leading-snug flex-1">
                    {task.title}
                </h4>

                {/* Edit & Delete buttons (only for admin/manager) */}
                {canManage && (
                    <div
                        className="flex gap-0.5 flex-shrink-0"
                        onPointerDown={(e) => e.stopPropagation()} // prevent drag when clicking buttons
                    >
                        {/* Edit button */}
                        <button
                            onClick={onEdit}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        >
                            <Pencil size={12} />
                        </button>

                        {/* Delete button */}
                        <button
                            onClick={onDelete}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* ───────── DESCRIPTION ───────── */}
            {task.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {task.description}
                </p>
            )}

            {/* ───────── TAGS / BADGES ───────── */}
            <div className="flex flex-wrap gap-1.5 mb-3">

                {/* Task type (feature, bug, etc.) */}
                <Badge label={task.type} variant={task.type} />

                {/* Priority badge */}
                <Badge label={task.priority} variant={task.priority} />

                {/* Project badge (if task belongs to a project) */}
                {task.projectId && (() => {
                    const project = projects.find((p) => p.id === task.projectId);

                    return project ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            <FolderOpen size={9} />
                            {project.name}
                        </span>
                    ) : null;
                })()}
            </div>

            {/* ───────── FOOTER INFO ───────── */}
            <div className="flex items-center justify-between text-xs text-gray-400">

                {/* Left side: due date + assignee */}
                <div className="flex items-center gap-2">

                    {/* Due date */}
                    {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                            <Calendar size={11} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    )}

                    {/* Assignee */}
                    {task.assigneeName && (
                        <span className="flex items-center gap-1">
                            <User size={11} />
                            {task.assigneeName.split(' ')[0]} {/* show first name */}
                        </span>
                    )}
                </div>

                {/* Right side: comments count */}
                {task.comments?.length > 0 && (
                    <span className="flex items-center gap-1">
                        <MessageCircle size={11} />
                        {task.comments.length}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TaskCard;