/**
 * renderWithProviders – wraps any component in the full provider tree
 * (Redux store, Router, NotificationProvider, ModalProvider, ThemeProvider)
 * so individual test files don't need to repeat boilerplate.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import authReducer from '../../features/auth/authSlice';
import tasksReducer from '../../features/tasks/tasksSlice';
import projectsReducer from '../../features/projects/projectsSlice';
import usersReducer from '../../features/users/usersSlice';
import dashboardReducer from '../../features/dashboard/dashboardSlice';

import { ThemeProvider } from '../../context/ThemeContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { ModalProvider } from '../../context/ModalContext';

// ─── Default initial slices ──────────────────────────────────────────────────
export const defaultAuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const defaultAdminUser = {
  uid: 'admin-uid-1',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'admin',
};

export const defaultManagerUser = {
  uid: 'manager-uid-1',
  name: 'Manager User',
  email: 'manager@test.com',
  role: 'manager',
};

export const defaultEmployeeUser = {
  uid: 'employee-uid-1',
  name: 'Employee User',
  email: 'employee@test.com',
  role: 'employee',
};

// ─── Factory ─────────────────────────────────────────────────────────────────
/**
 * @param {object} ui              - The React component to render
 * @param {object} preloadedState  - slice-level overrides
 * @param {object} renderOptions   - RTL render options (route, initialEntries)
 */
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    route = '/',
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      tasks: tasksReducer,
      projects: projectsReducer,
      users: usersReducer,
      dashboard: dashboardReducer,
    },
    preloadedState,
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <NotificationProvider>
            <ModalProvider>
              <MemoryRouter initialEntries={initialEntries}>
                {children}
              </MemoryRouter>
            </ModalProvider>
          </NotificationProvider>
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}