// TaskForm Component
// Used for creating and updating tasks in the Kanban system

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useDispatch, useSelector } from 'react-redux';
import { createTask, updateTask } from './tasksSlice';
import { fetchProjects } from '../projects/ProjectsSlice';

import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import { FolderOpen } from 'lucide-react';


// ─────────────────────────────────────────────────────────────
// VALIDATION SCHEMA (Yup)
// ─────────────────────────────────────────────────────────────
const schema = yup.object({
    title: yup.string().min(2).required('Title is required'),
    description: yup.string(),
    type: yup.string().oneOf(['bug', 'feature', 'improvement']).required(),
    priority: yup.string().oneOf(['low', 'medium', 'high']).required(),
    status: yup.string().required(),
    dueDate: yup.string().nullable(),
    assigneeId: yup.string().nullable(),
    selectedProjectId: yup.string().nullable(), // handled separately
});


// Common input styling
const inputClass =
    'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';


// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const TaskForm = ({ task, defaultStatus = 'todo', projectId, onSuccess }) => {

    const dispatch = useDispatch();
    const { notify } = useNotification();

    // Redux state
    const { items: users } = useSelector((s) => s.users);
    const { items: projects } = useSelector((s) => s.projects);
    const { user } = useSelector((s) => s.auth);

    // Role check (for permissions)
    const isEmployee = user?.role === 'employee';


    // ─────────────────────────────────────────────────────────
    // Ensure projects are loaded (needed for dropdown)
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (projects.length === 0) dispatch(fetchProjects());
    }, [dispatch, projects.length]);


    // Determine initial project selection
    // Priority: task.projectId > URL projectId > empty
    const initialProjectId = task?.projectId || projectId || '';


    // ─────────────────────────────────────────────────────────
    // FORM SETUP (react-hook-form)
    // ─────────────────────────────────────────────────────────
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: yupResolver(schema),

        // Default values for edit vs create
        defaultValues: task
            ? {
                title: task.title,
                description: task.description,
                type: task.type,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
                selectedProjectId: task.projectId || '',
            }
            : {
                type: 'feature',
                priority: 'medium',
                status: defaultStatus,
                selectedProjectId: projectId || '',
            },
    });


    // ─────────────────────────────────────────────────────────
    // FORM SUBMIT HANDLER
    // ─────────────────────────────────────────────────────────
    const onSubmit = async (formData) => {

        // Separate project selection from other fields
        const { selectedProjectId, ...rest } = formData;

        // Find assignee name from user list
        const assignee = users.find((u) => u.uid === rest.assigneeId);

        // Resolve project ID (form > URL > null)
        const resolvedProjectId = selectedProjectId || projectId || null;

        // Final payload sent to backend
        const payload = {
            ...rest,
            projectId: resolvedProjectId,
            assigneeName: assignee?.name || null,
        };

        // Choose action (create vs update)
        const action = task
            ? updateTask({ id: task.id, ...payload })
            : createTask(payload);

        const result = await dispatch(action);

        // Handle success / error
        if (result.meta.requestStatus === 'fulfilled') {
            notify(task ? 'Task updated!' : 'Task created!', 'success');
            onSuccess?.(); // close modal
        } else {
            notify(result.payload || 'Something went wrong', 'error');
        }
    };


    // Lock project selection if opened from project page
    const projectLocked = Boolean(projectId);


    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* ───────── TITLE ───────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Title *
                </label>
                <input {...register('title')} placeholder="Task title" className={inputClass} />
                {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
            </div>


            {/* ───────── DESCRIPTION ───────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Details…"
                    className={`${inputClass} resize-none`}
                />
            </div>


            {/* ───────── PROJECT SELECTION ───────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <FolderOpen size={13} className="text-gray-400" />
                    Project
                    <span className="text-gray-400 text-xs">(optional)</span>
                </label>

                {projectLocked ? (
                    // Read-only when accessed from a specific project
                    <div className={`${inputClass} bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed`}>
                        {projects.find((p) => p.id === projectId)?.name || 'Current project'}
                    </div>
                ) : (
                    <select {...register('selectedProjectId')} className={inputClass}>
                        <option value="">No project (standalone task)</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                )}
            </div>


            {/* ───────── TYPE / PRIORITY / STATUS ───────── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { name: 'type', opts: ['feature', 'bug', 'improvement'] },
                    { name: 'priority', opts: ['low', 'medium', 'high'] },
                    { name: 'status', opts: ['todo', 'in-progress', 'review', 'done'] },
                ].map((field) => (
                    <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 capitalize">
                            {field.name}
                        </label>
                        <select {...register(field.name)} className={inputClass}>
                            {field.opts.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>


            {/* ───────── DUE DATE & ASSIGNEE ───────── */}
            <div className="grid grid-cols-2 gap-3">

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Due date
                    </label>
                    <input {...register('dueDate')} type="date" className={inputClass} />
                </div>

                {/* Assignee */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Assignee
                    </label>

                    {isEmployee ? (
                        // Employees cannot reassign tasks
                        <div className={`${inputClass} bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed`}>
                            {users.find((u) => u.uid === task?.assigneeId)?.name || 'Unassigned'}
                        </div>
                    ) : (
                        <select {...register('assigneeId')} className={inputClass}>
                            <option value="">Unassigned</option>
                            {users.map((u) => (
                                <option key={u.uid} value={u.uid}>{u.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>


            {/* ───────── SUBMIT BUTTON ───────── */}
            <div className="flex justify-end pt-2">
                <Button type="submit" loading={isSubmitting}>
                    {task ? 'Save changes' : 'Create task'}
                </Button>
            </div>
        </form>
    );
};

export default TaskForm;