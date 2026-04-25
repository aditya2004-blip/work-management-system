import { useEffect, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, deleteProject } from './projectsSlice.jsx';
import { Plus, Pencil, Trash2, ExternalLink, FolderOpen, Info } from 'lucide-react';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import Button from '../../components/common/Button.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { formatDistanceToNow } from 'date-fns';

// Lazy load ProjectForm to optimize performance
const ProjectForm = lazy(() => import('./ProjectForm'));

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Modal & Notification context usage
  const { openModal, closeModal, isOpen, modalProps, modalType } = useModal();
  const { notify } = useNotification();

  // Redux state
  const { items: projects, loading } = useSelector((s) => s.projects);
  const { user } = useSelector((s) => s.auth);

  // Role-based permissions
  const canManage = ['admin', 'manager'].includes(user?.role);
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  // Fetch projects on mount
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // Delete project handler
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;

    const result = await dispatch(deleteProject(id));

    if (deleteProject.fulfilled.match(result)) {
      notify('Project deleted', 'success');
    } else {
      notify(result.payload || 'Failed to delete', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 mt-1 text-sm">{projects.length} projects total</p>
        </div>

        {/* Create Project Button (only admin/manager) */}
        {canManage && (
          <Button onClick={() => openModal('projectForm', { project: null })}>
            <Plus size={16} />New project
          </Button>
        )}
      </div>

      {/* Employee-specific info */}
      {isEmployee && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
          <Info size={15} className="flex-shrink-0" />
          <span>Showing projects you are a member of.</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (

        // Empty State
        <div className="flex flex-col items-center py-20 text-center">
          <FolderOpen size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="font-medium text-gray-600 dark:text-gray-300 mb-2">No projects yet</h3>
          {canManage && (
            <Button onClick={() => openModal('projectForm', { project: null })} className="mt-4">
              <Plus size={16} />Create project
            </Button>
          )}
        </div>

      ) : (

        // Project Cards Grid
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-all">

              {/* Project Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{p.name}</h3>
                <Badge label={p.status} variant={p.status} />
              </div>

              {/* Description */}
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                {p.description || 'No description.'}
              </p>

              {/* Due Date */}
              {p.dueDate && (
                <p className="text-xs text-gray-400 mb-4">
                  Due: {new Date(p.dueDate).toLocaleDateString()}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">

                {/* View Tasks */}
                <button
                  onClick={() => navigate(`/tasks?projectId=${p.id}`)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  <ExternalLink size={12} />View tasks
                </button>

                {/* Edit/Delete (based on role) */}
                {canManage && (
                  <div className="ml-auto flex gap-1">

                    {/* Edit */}
                    <button
                      onClick={() => openModal('projectForm', { project: p })}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete (admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit Project */}
      <Modal
        isOpen={isOpen && modalType === 'projectForm'}
        onClose={closeModal}
        title={modalProps?.project ? 'Edit project' : 'New project'}
      >
        <Suspense fallback={<Loader fullscreen={false} size="sm" />}>
          <ProjectForm
            project={modalProps?.project}
            onSuccess={closeModal}
          />
        </Suspense>
      </Modal>
    </div>
  );
};

export default ProjectList;