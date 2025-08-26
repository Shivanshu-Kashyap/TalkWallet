import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import groupSlice from './slices/groupSlice';
import messageSlice from './slices/messageSlice';
import { api } from './api';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    groups: groupSlice,
    messages: messageSlice,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export default store;
