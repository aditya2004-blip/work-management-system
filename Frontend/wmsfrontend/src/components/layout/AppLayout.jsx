import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar.jsx';

// Main layout wrapper for the app
const AppLayout = () => (
  <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

    {/* Sidebar navigation */}
    <Sidebar />

    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

      {/* Top navigation bar */}
      <Topbar />

      {/* Main content area (renders routed components) */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;