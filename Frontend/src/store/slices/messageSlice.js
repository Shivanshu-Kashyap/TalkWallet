import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: {},
  activeHeadings: {},
  loading: false,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      const { groupId, messages } = action.payload;
      state.messages[groupId] = messages;
    },
    addMessage: (state, action) => {
      const { groupId, message } = action.payload;
      if (!state.messages[groupId]) {
        state.messages[groupId] = [];
      }
      state.messages[groupId].push(message);
    },
    setActiveHeading: (state, action) => {
      const { groupId, heading } = action.payload;
      state.activeHeadings[groupId] = heading;
    },
    clearActiveHeading: (state, action) => {
      const { groupId } = action.payload;
      delete state.activeHeadings[groupId];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  },
});

export const {
  setMessages,
  addMessage,
  setActiveHeading,
  clearActiveHeading,
  setLoading
} = messageSlice.actions;
export default messageSlice.reducer;
