import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// Async thunk to fetch latest activities from Firestore
export const fetchActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      // Firestore query: get latest 20 activities sorted by createdAt (descending)
      const q = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snap = await getDocs(q);

      // Transform Firestore docs into plain JS objects
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      return rejectWithValue('Failed to fetch activity feed');
    }
  }
);

// Dashboard slice for activity feed state management
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { activities: [], loading: false, error: null },
  reducers: {
    // Add new activity in real-time (e.g., via socket)
    activityAdded(state, { payload }) {
      state.activities.unshift(payload); // add to top
      if (state.activities.length > 20) state.activities.pop(); // keep max 20 items
    },
  },
  extraReducers: (builder) => {
    builder
      // Loading state when fetching activities
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
      })

      // Success: store activities in state
      .addCase(fetchActivities.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.activities = payload;
      })

      // Error handling
      .addCase(fetchActivities.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { activityAdded } = dashboardSlice.actions;
export default dashboardSlice.reducer;