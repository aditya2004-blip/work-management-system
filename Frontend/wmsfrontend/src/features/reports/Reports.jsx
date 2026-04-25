// Dependencies: react, react-redux, recharts (npm)
// Consumes: tasksSlice, projectsSlice, usersSlice (Redux)

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../tasks/tasksSlice';
import { fetchProjects } from '../projects/projectsSlice';
import { fetchUsers } from '../users/usersSlice';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3, ChevronDown, Users, FolderOpen } from 'lucide-react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];
const STATUS_COLORS = {
    'todo': '#9ca3af',
    'in-progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#22c55e',
};

const ChartCard = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h2>
        {children}
    </div>
);

const Reports = () => {
    const dispatch = useDispatch();
    const { items: allTasks } = useSelector((s) => s.tasks);
    const { items: allProjects } = useSelector((s) => s.projects);
    const { items: allUsers } = useSelector((s) => s.users);
    const { user: me } = useSelector((s) => s.auth);

    const isManager = me?.role === 'manager' || me?.role === 'admin';

    // Selected user filter — null means "all users" (admin/manager global view)
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        dispatch(fetchTasks());
        dispatch(fetchProjects());
        if (isManager) dispatch(fetchUsers());
    }, [dispatch, isManager]);

    // Only employees appear in the dropdown (not other admins/managers)
    const employees = useMemo(
        () => allUsers.filter((u) => u.role === 'employee'),
        [allUsers]
    );

    // Decide which tasks to use for charts
    const tasks = useMemo(() => {
        if (!isManager) {
            // Employee always sees only their own tasks
            return allTasks.filter((t) => t.assigneeId === me?.uid);
        }
        if (selectedUserId) {
            // Admin/manager filtered to a specific user
            return allTasks.filter((t) => t.assigneeId === selectedUserId);
        }
        return allTasks; // All tasks (global view)
    }, [allTasks, isManager, selectedUserId, me]);

    const projects = useMemo(() => {
        if (selectedUserId) {
            return allProjects.filter((p) =>
                Array.isArray(p.members) && p.members.includes(selectedUserId)
            );
        }
        return allProjects;
    }, [allProjects, selectedUserId]);

    // Chart data
    const tasksByStatus = useMemo(() =>
        ['todo', 'in-progress', 'review', 'done'].map((s) => ({
            name: { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s],
            value: tasks.filter((t) => t.status === s).length,
        })), [tasks]);

    const tasksByType = useMemo(() =>
        ['feature', 'bug', 'improvement']
            .map((t) => ({
                name: t.charAt(0).toUpperCase() + t.slice(1),
                value: tasks.filter((tk) => tk.type === t).length,
            }))
            .filter((d) => d.value > 0),
        [tasks]);

    const tasksByPriority = useMemo(() =>
        ['high', 'medium', 'low'].map((p) => ({
            name: p.charAt(0).toUpperCase() + p.slice(1),
            value: tasks.filter((t) => t.priority === p).length,
        })), [tasks]);

    const projectByStatus = useMemo(() =>
        ['active', 'completed', 'pending', 'archived']
            .map((s) => ({
                name: s.charAt(0).toUpperCase() + s.slice(1),
                value: projects.filter((p) => p.status === s).length,
            }))
            .filter((d) => d.value > 0),
        [projects]);

    // Tasks per project — stacked by status
    // Tasks with no projectId show as "No Project"
    const tasksByProject = useMemo(() => {
        const projectMap = new Map(
            projects.map((p) => [p.id, { name: p.name, todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 }])
        );
        // Bucket for tasks not linked to any project
        const noProject = { name: 'No Project', todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };

        tasks.forEach((t) => {
            const bucket = t.projectId && projectMap.has(t.projectId)
                ? projectMap.get(t.projectId)
                : noProject;
            if (bucket[t.status] !== undefined) bucket[t.status]++;
            bucket.total++;
        });

        const rows = [...projectMap.values()];
        if (noProject.total > 0) rows.push(noProject);
        return rows.filter((r) => r.total > 0);
    }, [tasks, projects]);

    // Task share per project (for pie chart)
    const taskShareByProject = useMemo(() =>
        tasksByProject
            .map((p) => ({ name: p.name, value: p.total }))
            .filter((p) => p.value > 0),
        [tasksByProject]);

    // Truncate long project names for X-axis
    const shortName = (name, max = 12) =>
        name.length > max ? name.slice(0, max) + '…' : name;

    const ttStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' };
    const axisOpts = { fontSize: 12, fill: '#9ca3af' };
    const rate = tasks.length
        ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
        : 0;

    // Selected user name for display
    const selectedUser = useMemo(
        () => allUsers.find((u) => u.uid === selectedUserId),
        [allUsers, selectedUserId]
    );

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <BarChart3 size={22} className="text-gray-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
                        <p className="text-gray-500 mt-0.5 text-sm">
                            {isManager
                                ? selectedUser
                                    ? `Viewing data for ${selectedUser.name}`
                                    : 'Global workspace overview'
                                : 'Your personal task overview'}
                        </p>
                    </div>
                </div>

                {/* User filter dropdown — admin/manager only */}
                {isManager && employees.length > 0 && (
                    <div className="relative">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm cursor-pointer hover:border-indigo-400 transition-colors">
                            <Users size={15} className="text-gray-400 flex-shrink-0" />
                            <select
                                value={selectedUserId || ''}
                                onChange={(e) => setSelectedUserId(e.target.value || null)}
                                className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none cursor-pointer pr-6 appearance-none dark:bg-gray-900"
                            >
                                <option value="">All employees</option>
                                {employees.map((u) => (
                                    <option key={u.uid} value={u.uid}>{u.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="text-gray-400 pointer-events-none absolute right-3" />
                        </div>
                    </div>
                )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total tasks', value: tasks.length, color: 'text-indigo-600' },
                    { label: 'Completion', value: `${rate}%`, color: 'text-green-600' },
                    { label: 'Active projects', value: projects.filter((p) => p.status === 'active').length, color: 'text-blue-600' },
                    { label: 'High priority', value: tasks.filter((t) => t.priority === 'high').length, color: 'text-red-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center hover:shadow-md transition-shadow">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Employee task table (admin/manager per-user view) */}
            {isManager && !selectedUserId && employees.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={16} className="text-gray-500" />
                        Employee task breakdown
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    {['Employee', 'To Do', 'In Progress', 'Review', 'Done', 'Total', 'Completion'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {employees.map((emp) => {
                                    const empTasks = allTasks.filter((t) => t.assigneeId === emp.uid);
                                    const done = empTasks.filter((t) => t.status === 'done').length;
                                    const inProg = empTasks.filter((t) => t.status === 'in-progress').length;
                                    const review = empTasks.filter((t) => t.status === 'review').length;
                                    const todo = empTasks.filter((t) => t.status === 'todo').length;
                                    const compRate = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0;
                                    return (
                                        <tr
                                            key={emp.uid}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedUserId(emp.uid)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex-shrink-0">
                                                        {emp.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">{emp.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{todo}</td>
                                            <td className="px-4 py-3 text-blue-600 font-medium">{inProg}</td>
                                            <td className="px-4 py-3 text-yellow-600 font-medium">{review}</td>
                                            <td className="px-4 py-3 text-green-600 font-medium">{done}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold">{empTasks.length}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-[60px]">
                                                        <div
                                                            className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                                            style={{ width: `${compRate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 w-8">{compRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Charts — existing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Tasks by status">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={tasksByStatus} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={axisOpts} />
                            <YAxis tick={axisOpts} allowDecimals={false} />
                            <Tooltip contentStyle={ttStyle} />
                            <Bar dataKey="value" name="Tasks" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tasks by type">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={tasksByType}
                                cx="50%" cy="50%" outerRadius={90}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {tasksByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={ttStyle} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tasks by priority">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={tasksByPriority} layout="vertical" barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis type="number" tick={axisOpts} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={axisOpts} width={60} />
                            <Tooltip contentStyle={ttStyle} />
                            <Bar dataKey="value" name="Tasks" radius={[0, 6, 6, 0]}>
                                {tasksByPriority.map((_, i) => (
                                    <Cell key={i} fill={['#ef4444', '#f59e0b', '#22c55e'][i]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Projects by status">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={projectByStatus} barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis dataKey="name" tick={axisOpts} />
                            <YAxis tick={axisOpts} allowDecimals={false} />
                            <Tooltip contentStyle={ttStyle} />
                            <Bar dataKey="value" name="Projects" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ── Project-level charts ───────────────────────────────────────────── */}
            {tasksByProject.length > 0 && (
                <>
                    {/* Section header */}
                    <div className="flex items-center gap-2 pt-2">
                        <FolderOpen size={18} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-900 dark:text-white text-lg">Tasks by project</h2>
                        <span className="text-xs text-gray-400 ml-1">
                            — which tasks belong to which project
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Stacked bar: tasks per project, split by status */}
                        <ChartCard title="Task status breakdown per project">
                            {tasksByProject.length === 0 ? (
                                <p className="text-sm text-gray-400 py-8 text-center">No project-linked tasks yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={tasksByProject.map((p) => ({ ...p, name: shortName(p.name) }))}
                                        barSize={28}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="name" tick={axisOpts} interval={0} />
                                        <YAxis tick={axisOpts} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={ttStyle}
                                            formatter={(value, name) => [
                                                value,
                                                { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[name] || name,
                                            ]}
                                        />
                                        <Legend
                                            formatter={(value) =>
                                                ({ todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[value] || value)
                                            }
                                        />
                                        <Bar dataKey="todo" stackId="s" fill={STATUS_COLORS['todo']} name="todo" />
                                        <Bar dataKey="in-progress" stackId="s" fill={STATUS_COLORS['in-progress']} name="in-progress" />
                                        <Bar dataKey="review" stackId="s" fill={STATUS_COLORS['review']} name="review" />
                                        <Bar dataKey="done" stackId="s" fill={STATUS_COLORS['done']} name="done" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Pie: share of total tasks per project */}
                        <ChartCard title="Task share by project">
                            {taskShareByProject.length === 0 ? (
                                <p className="text-sm text-gray-400 py-8 text-center">No project-linked tasks yet</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={taskShareByProject}
                                            cx="40%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={105}
                                            dataKey="value"
                                            paddingAngle={3}
                                        >
                                            {taskShareByProject.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={ttStyle}
                                            formatter={(value, name) => [
                                                `${value} task${value !== 1 ? 's' : ''}`,
                                                shortName(name, 22),
                                            ]}
                                        />
                                        {/* Legend on the right — never overlaps the donut */}
                                        <Legend
                                            layout="vertical"
                                            align="right"
                                            verticalAlign="middle"
                                            iconType="circle"
                                            iconSize={9}
                                            formatter={(value) => (
                                                <span style={{ fontSize: 12, color: '#6b7280' }}>
                                                    {shortName(value, 18)}
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Project breakdown table */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FolderOpen size={16} className="text-gray-500" />
                            Project task breakdown
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                        {['Project', 'To Do', 'In Progress', 'Review', 'Done', 'Total', 'Completion'].map((h) => (
                                            <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {tasksByProject.map((row) => {
                                        const compRate = row.total ? Math.round((row.done / row.total) * 100) : 0;
                                        return (
                                            <tr key={row.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FolderOpen size={14} className="text-indigo-500 flex-shrink-0" />
                                                        <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{row.todo}</td>
                                                <td className="px-4 py-3 text-blue-600 font-medium">{row['in-progress']}</td>
                                                <td className="px-4 py-3 text-yellow-600 font-medium">{row.review}</td>
                                                <td className="px-4 py-3 text-green-600 font-medium">{row.done}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-semibold">{row.total}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-[60px]">
                                                            <div
                                                                className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                                                style={{ width: `${compRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-8">{compRate}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;