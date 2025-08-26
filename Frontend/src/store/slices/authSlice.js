import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.tokens.accessToken;
      localStorage.setItem('token', action.payload.tokens.accessToken);
    },
    loginFailure: (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, setUser } = authSlice.actions;
export default authSlice.reducer;
