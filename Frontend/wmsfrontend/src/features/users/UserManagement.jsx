import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, deleteUser } from './usersSlice';
import { useForm } from 'react-hook-form';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { Pencil, Trash2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useModal } from '../../context/ModalContext';
import { useNotification } from '../../context/NotificationContext';

// Shared input styling
const inputClass = 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all';

const UserManagement = () => {
    const dispatch = useDispatch();

    // Redux state
    const { items: users, loading } = useSelector((s) => s.users);
    const { user: me } = useSelector((s) => s.auth);

    // Context APIs
    const { openModal, closeModal, isOpen, modalProps, modalType } = useModal();
    const { notify } = useNotification();

    // React Hook Form for edit modal
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    /**
     * ─────────────────────────────────────────────
     * FETCH USERS ON COMPONENT MOUNT
     * ─────────────────────────────────────────────
     */
    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    /**
     * ─────────────────────────────────────────────
     * OPEN EDIT MODAL
     * Pre-fill form with selected user data
     * ─────────────────────────────────────────────
     */
    const openEdit = (u) => {
        openModal('userEdit', { user: u });
        reset({
            name: u.name,
            role: u.role,
            status: u.status || 'active'
        });
    };

    /**
     * ─────────────────────────────────────────────
     * HANDLE UPDATE USER
     * ─────────────────────────────────────────────
     */
    const onSubmit = async (data) => {
        const result = await dispatch(
            updateUser({ id: modalProps.user.uid, ...data })
        );

        if (updateUser.fulfilled.match(result)) {
            notify('User updated', 'success');
            closeModal();
        } else {
            notify(result.payload || 'Failed to update', 'error');
        }
    };

    /**
     * ─────────────────────────────────────────────
     * HANDLE DELETE USER
     * ─────────────────────────────────────────────
     */
    const handleDelete = async (uid, name) => {
        if (!window.confirm(`Delete user "${name}"?`)) return;

        const result = await dispatch(deleteUser(uid));

        if (deleteUser.fulfilled.match(result)) {
            notify('User deleted', 'success');
        } else {
            notify(result.payload || 'Failed to delete', 'error');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">

            {/* ───────── HEADER ───────── */}
            <div className="flex items-center gap-3">
                <Users size={22} className="text-gray-500" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        User Management
                    </h1>
                    <p className="text-gray-500 mt-0.5 text-sm">
                        {users.length} users in workspace
                    </p>
                </div>
            </div>

            {/* ───────── USERS TABLE ───────── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">

                    {/* TABLE HEADER */}
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            {['User', 'Role', 'Status', 'Last active', 'Actions'].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* TABLE BODY */}
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">

                        {/* LOADING SKELETON */}
                        {loading
                            ? [1, 2, 3].map((i) => (
                                <tr key={i}>
                                    {[1, 2, 3, 4, 5].map((j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))

                            /* USER ROWS */
                            : users.map((u) => (
                                <tr
                                    key={u.uid}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    {/* USER INFO */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                                                {u.name?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {u.name}
                                                    {/* Show "(you)" for current user */}
                                                    {u.uid === me?.uid && (
                                                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* ROLE */}
                                    <td className="px-4 py-3">
                                        <Badge label={u.role} variant={u.role} />
                                    </td>

                                    {/* STATUS */}
                                    <td className="px-4 py-3">
                                        <Badge label={u.status || 'active'} variant={u.status || 'active'} />
                                    </td>

                                    {/* LAST ACTIVITY */}
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                        {u.lastActivity
                                            ? formatDistanceToNow(new Date(u.lastActivity), { addSuffix: true })
                                            : 'Never'}
                                    </td>

                                    {/* ACTION BUTTONS */}
                                    <td className="px-4 py-3">
                                        {/* Prevent self-edit/delete */}
                                        {u.uid !== me?.uid && (
                                            <div className="flex gap-1">

                                                {/* EDIT */}
                                                <button
                                                    onClick={() => openEdit(u)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                                >
                                                    <Pencil size={14} />
                                                </button>

                                                {/* DELETE */}
                                                <button
                                                    onClick={() => handleDelete(u.uid, u.name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* ───────── EDIT USER MODAL ───────── */}
            <Modal
                isOpen={isOpen && modalType === 'userEdit'}
                onClose={closeModal}
                title={`Edit — ${modalProps?.user?.name}`}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* NAME */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Full name
                        </label>
                        <input {...register('name')} className={inputClass} />
                    </div>

                    {/* ROLE & STATUS */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* ROLE */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Role
                            </label>
                            <select {...register('role')} className={inputClass}>
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* STATUS */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Status
                            </label>
                            <select {...register('status')} className={inputClass}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="flex justify-end pt-2">
                        <Button type="submit" loading={isSubmitting}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UserManagement;