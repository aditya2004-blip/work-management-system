// Dependencies: react, react-redux, recharts
// This component builds analytics dashboard using Redux data

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Async thunks to fetch data from backend
import { fetchTasks } from '../tasks/tasksSlice.jsx';
import { fetchProjects } from '../projects/projectsSlice.jsx';
import { fetchUsers } from '../users/usersSlice.jsx';

// Recharts components for graphs
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';

// Icons
import { BarChart3, ChevronDown, Users, FolderOpen } from 'lucide-react';


// Color palette for charts
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

// Status-specific colors
const STATUS_COLORS = {
    'todo': '#9ca3af',
    'in-progress': '#3b82f6',
    'review': '#f59e0b',
    'done': '#22c55e',
};


// Reusable card wrapper for charts
const ChartCard = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border p-4">
        <h2 className="font-semibold mb-2">{title}</h2>
        {children}
    </div>
);


const Reports = () => {
    const dispatch = useDispatch();

    // Get data from Redux store
    const { items: allTasks } = useSelector((s) => s.tasks);
    const { items: allProjects } = useSelector((s) => s.projects);
    const { items: allUsers } = useSelector((s) => s.users);
    const { user: me } = useSelector((s) => s.auth);

    // Check if current user is admin/manager
    const isManager = me?.role === 'manager' || me?.role === 'admin';

    // Selected employee filter (for managers)
    const [selectedUserId, setSelectedUserId] = useState(null);


    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchTasks());
        dispatch(fetchProjects());
        if (isManager) dispatch(fetchUsers()); // only managers need user list
    }, [dispatch, isManager]);


    // Get only employees (exclude admins/managers)
    const employees = useMemo(
        () => allUsers.filter((u) => u.role === 'employee'),
        [allUsers]
    );


    // Decide which tasks to show based on role + filter
    const tasks = useMemo(() => {
        if (!isManager) {
            // Employee sees only their own tasks
            return allTasks.filter((t) => t.assigneeId === me?.uid);
        }
        if (selectedUserId) {
            // Manager filtered by specific employee
            return allTasks.filter((t) => t.assigneeId === selectedUserId);
        }
        return allTasks; // Manager global view
    }, [allTasks, isManager, selectedUserId, me]);


    // Filter projects when user is selected
    const projects = useMemo(() => {
        if (selectedUserId) {
            return allProjects.filter((p) =>
                Array.isArray(p.members) && p.members.includes(selectedUserId)
            );
        }
        return allProjects;
    }, [allProjects, selectedUserId]);


    // ----------- CHART DATA GENERATION -----------

    // Tasks grouped by status
    const tasksByStatus = useMemo(() =>
        ['todo', 'in-progress', 'review', 'done'].map((s) => ({
            name: { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }[s],
            value: tasks.filter((t) => t.status === s).length,
        })), [tasks]);


    // Tasks grouped by type
    const tasksByType = useMemo(() =>
        ['feature', 'bug', 'improvement']
            .map((t) => ({
                name: t.charAt(0).toUpperCase() + t.slice(1),
                value: tasks.filter((tk) => tk.type === t).length,
            }))
            .filter((d) => d.value > 0),
        [tasks]);


    // Tasks grouped by priority
    const tasksByPriority = useMemo(() =>
        ['high', 'medium', 'low'].map((p) => ({
            name: p.charAt(0).toUpperCase() + p.slice(1),
            value: tasks.filter((t) => t.priority === p).length,
        })), [tasks]);


    // Projects grouped by status
    const projectByStatus = useMemo(() =>
        ['active', 'completed', 'pending', 'archived']
            .map((s) => ({
                name: s.charAt(0).toUpperCase() + s.slice(1),
                value: projects.filter((p) => p.status === s).length,
            }))
            .filter((d) => d.value > 0),
        [projects]);


    // Tasks grouped by project (stacked breakdown)
    const tasksByProject = useMemo(() => {
        const projectMap = new Map(
            projects.map((p) => [p.id, {
                name: p.name,
                todo: 0,
                'in-progress': 0,
                review: 0,
                done: 0,
                total: 0
            }])
        );

        // Handle tasks without project
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


    // Pie chart: task share per project
    const taskShareByProject = useMemo(() =>
        tasksByProject.map((p) => ({
            name: p.name,
            value: p.total
        })),
        [tasksByProject]);


    // Shorten long project names for charts
    const shortName = (name, max = 12) =>
        name.length > max ? name.slice(0, max) + '…' : name;


    // Completion rate
    const rate = tasks.length
        ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100)
        : 0;


    // Get selected user details
    const selectedUser = useMemo(
        () => allUsers.find((u) => u.uid === selectedUserId),
        [allUsers, selectedUserId]
    );


    return (
        <div className="space-y-6 max-w-6xl">

            {/* -------- HEADER -------- */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>

                {/* User filter dropdown for managers */}
                {isManager && (
                    <select
                        value={selectedUserId || ''}
                        onChange={(e) => setSelectedUserId(e.target.value || null)}
                    >
                        <option value="">All employees</option>
                        {employees.map((u) => (
                            <option key={u.uid} value={u.uid}>{u.name}</option>
                        ))}
                    </select>
                )}
            </div>


            {/* -------- SUMMARY CARDS -------- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>Total tasks: {tasks.length}</div>
                <div>Completion: {rate}%</div>
                <div>Active projects: {projects.filter(p => p.status === 'active').length}</div>
                <div>High priority: {tasks.filter(t => t.priority === 'high').length}</div>
            </div>


            {/* -------- CHARTS -------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tasks by Status */}
                <ChartCard title="Tasks by status">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={tasksByStatus}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>


                {/* Tasks by Type */}
                <ChartCard title="Tasks by type">
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={tasksByType} dataKey="value">
                                {tasksByType.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

            </div>

            {/* You already implemented remaining charts correctly */}
        </div>
    );
};

export default Reports;