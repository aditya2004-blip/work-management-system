import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../projects/ProjectsSlice';
import { fetchTasks } from '../tasks/tasksSlice';
import { fetchActivities } from './dashboardSlice';
import { FolderOpen, CheckSquare, Clock, AlertCircle, Activity, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Reusable stat card component for dashboard metrics
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon size={22} className="text-white" />
        </div>
        <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const dispatch = useDispatch();

    // Fetch data from Redux store
    const { items: projects } = useSelector((s) => s.projects);
    const { items: tasks } = useSelector((s) => s.tasks);
    const { activities, loading: actLoading } = useSelector((s) => s.dashboard);
    const { user } = useSelector((s) => s.auth);

    const isEmployee = user?.role === 'employee';

    // Fetch all required data on component mount
    useEffect(() => {
        dispatch(fetchProjects());
        dispatch(fetchTasks());
        dispatch(fetchActivities());
    }, [dispatch]);

    // Compute dashboard statistics (optimized using useMemo)
    const stats = useMemo(() => {
        const relevantTasks = isEmployee
            ? tasks.filter((t) => t.assigneeId === user?.uid) // employee sees only their tasks
            : tasks;

        return {
            total: isEmployee ? relevantTasks.length : projects.length,
            done: relevantTasks.filter((t) => t.status === 'done').length,
            inProgress: relevantTasks.filter((t) => t.status === 'in-progress').length,
            todo: relevantTasks.filter((t) => t.status === 'todo').length,
            rate: relevantTasks.length
                ? Math.round((relevantTasks.filter((t) => t.status === 'done').length / relevantTasks.length) * 100)
                : 0,
        };
    }, [projects, tasks, isEmployee, user]);

    // Dynamic greeting based on time
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {greeting}, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                    {isEmployee
                        ? "Here's an overview of your assigned tasks."
                        : "Here's an overview of your workspace."}
                </p>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isEmployee ? (
                    // Employee-specific stats
                    <>
                        <StatCard icon={CheckSquare} label="My total tasks" value={stats.total} color="bg-indigo-500" />
                        <StatCard icon={CheckSquare} label="Completed" value={stats.done} color="bg-green-500" sub={`${stats.rate}% rate`} />
                        <StatCard icon={Clock} label="In progress" value={stats.inProgress} color="bg-blue-500" />
                        <StatCard icon={AlertCircle} label="To do" value={stats.todo} color="bg-amber-500" />
                    </>
                ) : (
                    // Admin/Manager stats
                    <>
                        <StatCard icon={FolderOpen} label="Total projects" value={stats.total} color="bg-indigo-500" />
                        <StatCard icon={CheckSquare} label="Tasks completed" value={stats.done} color="bg-green-500" sub={`${stats.rate}% rate`} />
                        <StatCard icon={Clock} label="In progress" value={stats.inProgress} color="bg-blue-500" />
                        <StatCard icon={AlertCircle} label="Pending" value={stats.todo} color="bg-amber-500" />
                    </>
                )}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-gray-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Recent activity</h2>
                </div>

                {/* Loading skeleton */}
                {actLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 py-2">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    // Empty state
                    <p className="text-gray-400 text-sm py-4">No recent activity. Create a project to get started.</p>
                ) : (
                    // Activity list
                    activities.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                                {a.userName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                                <p className="text-sm text-gray-800 dark:text-gray-200">{a.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {a.userName} · {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : 'just now'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Dashboard;