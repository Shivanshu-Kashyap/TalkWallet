import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    addGroup: (state, action) => {
      state.groups.unshift(action.payload);
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  },
});

export const {
  setGroups,
  addGroup,
  setCurrentGroup,
  clearCurrentGroup,
  setLoading,
  setError
} = groupSlice.actions;
export default groupSlice.reducer;
