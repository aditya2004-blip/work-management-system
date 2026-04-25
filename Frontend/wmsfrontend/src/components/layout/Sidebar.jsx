import { NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice.jsx";
import {
    LayoutDashboard, FolderKanban, CheckSquare,
    Users, BarChart3, Settings, LogOut, Zap,
} from 'lucide-react';

// Common navigation links for all users
const BASE_LINKS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

// Links for admin & manager only
const MGMT_LINKS = [
    { to: '/reports', icon: BarChart3, label: 'Reports' },
];

// Dynamic styling for active/inactive nav links
const linkClass = ({ isActive }) => {
    return `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/90 hover:text-gray-900 dark:hover:text-white'
        }`;
}

const Sidebar = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((s) => s.auth);

    return (
        <aside className="w-72 flex-shrink-0 bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">

            {/* Logo / Branding */}
            <div className="h-16 px-6 flex items-center border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
                        <Zap size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white leading-none">WorkFlow Pro</p>
                        <p className="text-xs text-gray-400 mt-1">Team workspace</p>
                    </div>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

                {/* Base links (all users) */}
                {BASE_LINKS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} className={linkClass}>
                        <Icon size={18} className="opacity-80 group-hover:opacity-100" />
                        <span>{label}</span>
                    </NavLink>
                ))}

                {/* Reports (admin & manager only) */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    MGMT_LINKS.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={18} className="opacity-80 group-hover:opacity-100" />
                            <span>{label}</span>
                        </NavLink>
                    ))
                )}

                {/* User management (admin only) */}
                {user?.role === 'admin' && (
                    <NavLink to="/users" className={linkClass}>
                        <Users size={18} className="opacity-80 group-hover:opacity-100" />
                        <span>Users</span>
                    </NavLink>
                )}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">

                {/* Logged-in user details */}
                <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                        {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                    </div>
                </div>

                {/* Logout button */}
                <button
                    onClick={() => dispatch(logout())}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <LogOut size={16} />Sign out
                </button>
            </div>
        </aside>
    )
}

export default Sidebar;