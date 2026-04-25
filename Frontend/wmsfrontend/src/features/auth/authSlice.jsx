import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Login API call
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/login', credentials);
            localStorage.setItem('token', data.token); // persist token
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Login failed');
        }
    }
);

// Signup API call
export const signupUser = createAsyncThunk(
    'auth/signup',
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/auth/signup', userData);
            localStorage.setItem('token', data.token); // persist token
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Signup failed');
        }
    }
);

// Fetch current user (auto-login using token)
export const fetchMe = createAsyncThunk(
    'auth/me',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/auth/me');
            return data;
        } catch (err) {
            localStorage.removeItem('token'); // remove invalid token
            return rejectWithValue(err.response?.data?.message || 'Session expired');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: localStorage.getItem('token') || null, // initialize from storage
        loading: false,
        error: null,
    },
    reducers: {
        // Clear user session
        logout(state) {
            state.user = null;
            state.token = null;
            localStorage.removeItem('token');
        },
        clearError(state) { state.error = null; },
        setUser(state, { payload }) { state.user = payload; },
    },
    extraReducers: (builder) => {
        // Common handlers for async states
        const pending = (state) => { state.loading = true; state.error = null; };
        const rejected = (state, action) => { state.loading = false; state.error = action.payload; };
        const fulfilled = (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
        };

        builder
            // Login
            .addCase(loginUser.pending, pending)
            .addCase(loginUser.fulfilled, fulfilled)
            .addCase(loginUser.rejected, rejected)

            // Signup
            .addCase(signupUser.pending, pending)
            .addCase(signupUser.fulfilled, fulfilled)
            .addCase(signupUser.rejected, rejected)

            // Fetch user
            .addCase(fetchMe.fulfilled, (state, { payload }) => {
                state.user = payload;
            })
            .addCase(fetchMe.rejected, (state) => {
                state.token = null;
            });
    },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;