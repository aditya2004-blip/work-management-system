import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios.jsx';

/**
 * ─────────────────────────────────────────────────────────────
 * FETCH TASKS
 * Optionally accepts projectId to filter tasks by project
 * ─────────────────────────────────────────────────────────────
 */
export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (projectId, { rejectWithValue }) => {
    try {
      // Add query param only if projectId exists
      const params = projectId ? { projectId } : {};
      const { data } = await api.get('/tasks', { params });
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch tasks'
      );
    }
  }
);

/**
 * ─────────────────────────────────────────────────────────────
 * CREATE TASK
 * Sends new task data to backend
 * ─────────────────────────────────────────────────────────────
 */
export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/tasks', taskData);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create task'
      );
    }
  }
);

/**
 * ─────────────────────────────────────────────────────────────
 * UPDATE TASK
 * Updates existing task using task ID
 * ─────────────────────────────────────────────────────────────
 */
export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/tasks/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update task'
      );
    }
  }
);

/**
 * ─────────────────────────────────────────────────────────────
 * DELETE TASK
 * Removes task from backend using ID
 * ─────────────────────────────────────────────────────────────
 */
export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id; // return ID so we can remove from state
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete task'
      );
    }
  }
);

/**
 * ─────────────────────────────────────────────────────────────
 * TASKS SLICE
 * Manages task state globally using Redux Toolkit
 * ─────────────────────────────────────────────────────────────
 */
const tasksSlice = createSlice({
  name: 'tasks',

  // Initial state of tasks
  initialState: {
    items: [],     // list of tasks
    loading: false,
    error: null,
  },

  reducers: {
    /**
     * OPTIMISTIC UPDATE
     * Used during drag & drop before API confirmation
     */
    taskMoved(state, { payload }) {
      const task = state.items.find((t) => t.id === payload.taskId);
      if (task) task.status = payload.newStatus;
    },

    /**
     * SOCKET: Task added (real-time update)
     */
    taskAdded(state, { payload }) {
      if (!state.items.some((t) => t.id === payload.id)) {
        state.items.unshift(payload);
      }
    },

    /**
     * SOCKET: Task updated (real-time update)
     */
    taskUpdated(state, { payload }) {
      const idx = state.items.findIndex((t) => t.id === payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...payload };
      }
    },

    /**
     * SOCKET: Task removed (real-time update)
     */
    taskRemoved(state, { payload }) {
      state.items = state.items.filter((t) => t.id !== payload.id);
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * FETCH TASKS
       */
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload;
      })
      .addCase(fetchTasks.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      /**
       * CREATE TASK
       */
      .addCase(createTask.fulfilled, (state, { payload }) => {
        // Avoid duplicates (important for socket + API sync)
        if (!state.items.some((t) => t.id === payload.id)) {
          state.items.unshift(payload);
        }
      })

      /**
       * UPDATE TASK
       */
      .addCase(updateTask.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((t) => t.id === payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...payload };
        }
      })

      /**
       * DELETE TASK
       */
      .addCase(deleteTask.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((t) => t.id !== payload);
      });
  },
});

// Export actions for usage in components / socket listeners
export const { taskMoved, taskAdded, taskUpdated, taskRemoved } = tasksSlice.actions;

// Export reducer to configure store
export default tasksSlice.reducer;