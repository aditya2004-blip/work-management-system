// Dependencies: @reduxjs/toolkit, axios (npm)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

/**
 * ─────────────────────────────────────────────
 * FETCH USERS
 * Fetch all users from backend
 * ─────────────────────────────────────────────
 */
export const fetchUsers = createAsyncThunk(
    'users/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/users');
            return data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || 'Failed to fetch users'
            );
        }
    }
);

/**
 * ─────────────────────────────────────────────
 * UPDATE USER
 * Updates user details (name, role, status)
 * ─────────────────────────────────────────────
 */
export const updateUser = createAsyncThunk(
    'users/update',
    async ({ id, ...updates }, { rejectWithValue }) => {
        try {
            // Send updated fields to backend
            await api.put(`/users/${id}`, updates);

            // Return merged object for Redux state update
            return { id, ...updates };
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || 'Failed to update user'
            );
        }
    }
);

/**
 * ─────────────────────────────────────────────
 * DELETE USER
 * Removes user from backend
 * ─────────────────────────────────────────────
 */
export const deleteUser = createAsyncThunk(
    'users/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/users/${id}`);
            return id; // return id to remove from state
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.message || 'Failed to delete user'
            );
        }
    }
);

/**
 * ─────────────────────────────────────────────
 * USERS SLICE
 * Global state for user management
 * ─────────────────────────────────────────────
 */
const usersSlice = createSlice({
    name: 'users',

    // Initial state
    initialState: {
        items: [],     // list of users
        loading: false,
        error: null,
    },

    reducers: {
        // (Currently empty — can be used for socket updates later)
    },

    extraReducers: (builder) => {
        builder

            /**
             * FETCH USERS
             */
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload;
            })
            .addCase(fetchUsers.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })

            /**
             * UPDATE USER
             * Update user in local state after successful API call
             */
            .addCase(updateUser.fulfilled, (state, { payload }) => {
                // NOTE: backend uses uid instead of id
                const idx = state.items.findIndex(
                    (u) => u.uid === payload.id
                );

                if (idx !== -1) {
                    state.items[idx] = {
                        ...state.items[idx],
                        ...payload,
                    };
                }
            })

            /**
             * DELETE USER
             * Remove user from state
             */
            .addCase(deleteUser.fulfilled, (state, { payload }) => {
                state.items = state.items.filter(
                    (u) => u.uid !== payload
                );
            });
    },
});

export default usersSlice.reducer;