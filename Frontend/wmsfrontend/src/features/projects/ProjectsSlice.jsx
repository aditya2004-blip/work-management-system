

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/projects');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/projects', projectData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/projects/${id}`, updates);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/projects/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete project');
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { items: [], loading: false, error: null },
  reducers: {
    // Called by SocketContext when server broadcasts
    projectAdded(state, { payload }) {
      if (!state.items.some((p) => p.id === payload.id)) state.items.unshift(payload);
    },
    projectUpdated(state, { payload }) {
      const idx = state.items.findIndex((p) => p.id === payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload };
    },
    projectDeleted(state, { payload }) {
      state.items = state.items.filter((p) => p.id !== payload.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; })
      .addCase(fetchProjects.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(createProject.fulfilled, (state, { payload }) => {
        if (!state.items.some((p) => p.id === payload.id)) {
          state.items.unshift(payload);
        }
      })
      .addCase(updateProject.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex((p) => p.id === payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload };
      })
      .addCase(deleteProject.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((p) => p.id !== payload);
      });
  },
});

export const { projectAdded, projectUpdated, projectDeleted } = projectsSlice.actions;
export default projectsSlice.reducer;