import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: {},
  activeHeadings: {},
  orderItems: {}, // New: Store order items by headingId
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
      // Also clear related order items
      if (state.activeHeadings[groupId]) {
        delete state.orderItems[state.activeHeadings[groupId]._id];
      }
    },
    setOrderItems: (state, action) => {
      const { headingId, items } = action.payload;
      state.orderItems[headingId] = items;
    },
    addOrderItems: (state, action) => {
      const { headingId, items } = action.payload;
      if (!state.orderItems[headingId]) {
        state.orderItems[headingId] = [];
      }
      state.orderItems[headingId].push(...items);
    },
    removeOrderItem: (state, action) => {
      const { headingId, itemId } = action.payload;
      if (state.orderItems[headingId]) {
        state.orderItems[headingId] = state.orderItems[headingId].filter(
          item => item._id !== itemId
        );
      }
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
  setOrderItems,
  addOrderItems,
  removeOrderItem,
  setLoading
} = messageSlice.actions;
export default messageSlice.reducer;
