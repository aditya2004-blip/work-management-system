import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.jsx';
import projectsReducer from '../features/projects/ProjectsSlice.jsx';
import tasksReducer from '../features/tasks/tasksSlice.jsx';
import usersReducer from '../features/users/usersSlice.jsx';
import dashboardReducer from '../features/dashboard/dashboardSlice.jsx';

// Configure Redux store with multiple feature reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    users: usersReducer,
    dashboard: dashboardReducer,
  },

  // Disable serializable check (useful for non-serializable data like Dates, sockets, etc.)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;