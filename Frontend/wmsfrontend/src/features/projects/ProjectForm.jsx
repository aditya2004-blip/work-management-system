import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { createProject, updateProject } from './projectsSlice.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import Button from '../../components/common/Button.jsx';

// Validation schema for project form
const schema = yup.object({
    name: yup.string().min(2).required('Project name is required'),
    description: yup.string(),
    status: yup.string().oneOf(['active', 'completed', 'pending', 'archived']).required(),
    dueDate: yup.string().nullable(),
});

// Common input styling
const inputClass = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';

const ProjectForm = ({ project, onSuccess }) => {
    const dispatch = useDispatch();
    const { notify } = useNotification();

    // React Hook Form setup with validation and default values
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: project || { status: 'active' },
    });

    // Handle form submission (create or update project)
    const onSubmit = async (data) => {
        const action = project
            ? updateProject({ id: project.id, ...data }) // update existing project
            : createProject(data); // create new project

        const result = await dispatch(action);

        // Success & error handling using notifications
        if (result.meta.requestStatus === 'fulfilled') {
            notify(project ? 'Project updated!' : 'Project created!', 'success');
            onSuccess?.();
        } else {
            notify(result.payload || 'Something went wrong', 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

            {/* Project Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Project name *</label>
                <input {...register('name')} placeholder="e.g. Website redesign" className={inputClass} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea {...register('description')} rows={3} placeholder="Project goals…" className={`${inputClass} resize-none`} />
            </div>

            {/* Status & Due Date */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                    <select {...register('status')} className={inputClass}>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Due date</label>
                    <input {...register('dueDate')} type="date" className={inputClass} />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
                <Button type="submit" loading={isSubmitting}>
                    {project ? 'Save changes' : 'Create project'}
                </Button>
            </div>
        </form>
    );
};

export default ProjectForm;